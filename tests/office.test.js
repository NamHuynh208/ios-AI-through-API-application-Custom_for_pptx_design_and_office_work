import test from 'node:test';
import assert from 'node:assert/strict';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { createWord, createSpreadsheet, createSlides, inspectOffice, applyOfficeChanges, validateChanges, parseXML, replaceRunText, documentContext, readPackage } from '../src/office.js';

test('Word roundtrip, giữ decimal/tiếng Việt, không đọc lặp bảng', () => {
  const bytes = createWord('Báo cáo', 'Nguyễn Văn An\n1234.56 & <ghi chú>');
  const doc = inspectOffice(bytes, 'báo cáo.docx');
  assert.equal(doc.blocks[2].text, '1234.56 & <ghi chú>');
  const result = applyOfficeChanges(doc, [{ id: doc.blocks[1].id, text: 'Nguyễn Văn Bình' }]);
  assert.equal(inspectOffice(result, 'new.docx').blocks[1].text, 'Nguyễn Văn Bình');
  assert.equal(inspectOffice(bytes, 'old.docx').blocks[1].text, 'Nguyễn Văn An');
});
test('Word bảng/headers/revisions: đọc một lần và đánh dấu chỉ đọc', () => {
  const entries = unzipSync(createWord('Test', 'Before'));
  entries['word/document.xml'] = strToU8('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Giấy</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:ins w:id="1"><w:r><w:t>Proposed</w:t></w:r></w:ins></w:p></w:body></w:document>');
  entries['word/header2.xml'] = strToU8('<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>EVEN HEADER</w:t></w:r></w:p></w:hdr>');
  const doc = inspectOffice(zipSync(entries), 'table.docx');
  assert.equal(doc.blocks.filter(b => b.text === 'Giấy').length, 1);
  assert.ok(doc.blocks.some(b => b.text === 'EVEN HEADER'));
  const revision = doc.blocks.find(b => b.text === 'Proposed');
  assert.equal(revision.readOnly, true);
  assert.throws(() => validateChanges(doc, [{ id: revision.id, text: 'overwrite' }]));
});
test('Run replacement giữ style ở phần ngoài vùng thay', () => {
  const d = parseXML('<p><r><t>Mã: </t></r><r><t>{{ho_</t></r><r><t>ten}}</t></r><r bold="true"><t> KẾT THÚC</t></r></p>');
  const nodes = Array.from(d.getElementsByTagName('t'));
  replaceRunText(nodes, 'Mã: Nguyễn Văn An KẾT THÚC');
  assert.equal(nodes.map(n => n.textContent).join(''), 'Mã: Nguyễn Văn An KẾT THÚC');
  assert.equal(nodes[3].textContent, ' KẾT THÚC');
  assert.equal(nodes[3].parentNode.getAttribute('bold'), 'true');
});
test('Run replacement insertion/deletion/empty edges', () => {
  for (const value of ['', 'abcde', 'abXcde', 'abcd', 'Zabcde', 'abcdeZ', 'whole new']) {
    const d = parseXML('<p><t>ab</t><t>c</t><t>de</t></p>'), nodes = Array.from(d.getElementsByTagName('t'));
    replaceRunText(nodes, value); assert.equal(nodes.map(n => n.textContent).join(''), value);
  }
});
test('XLSX leading zeros, literal formula, numeric decimals, explicit formula', () => {
  const bytes = createSpreadsheet([['Mã', 'Tiền'], ['00123', 1234.56], ['=HYPERLINK("https://bad")', true]]);
  let doc = inspectOffice(bytes, 'test.xlsx');
  assert.equal(doc.blocks.find(b => b.label === 'Dữ liệu!A2').text, '00123');
  assert.equal(doc.blocks.find(b => b.label === 'Dữ liệu!A3').valueType, 'text');
  assert.equal(doc.blocks.find(b => b.label === 'Dữ liệu!B2').text, '1234.56');
  const block = doc.blocks.find(b => b.label === 'Dữ liệu!B2');
  const out = applyOfficeChanges(doc, [{ id: block.id, text: '=SUM(1,2)', valueType: 'formula' }]);
  doc = inspectOffice(out, 'test.xlsx');
  assert.equal(doc.blocks.find(b => b.id === block.id).text, '=SUM(1,2)');
  assert.equal(doc.blocks.find(b => b.id === block.id).cached, '');
});
test('Cache của mọi công thức bị xoá sau sửa input', () => {
  const entries = unzipSync(createSpreadsheet([['A', 'B'], [1, 2]]));
  let xml = strFromU8(entries['xl/worksheets/sheet1.xml']);
  xml = xml.replace('<c r="B2"><v>2</v></c>', '<c r="B2"><f>A2*2</f><v>2</v></c>');
  entries['xl/worksheets/sheet1.xml'] = strToU8(xml);
  const d = inspectOffice(zipSync(entries), 'test.xlsx');
  const out = applyOfficeChanges(d, [{ id: d.blocks.find(b => b.address === 'A2').id, text: '100', valueType: 'number' }]);
  const next = inspectOffice(out, 'test.xlsx');
  assert.equal(next.blocks.find(b => b.address === 'B2').cached, '');
  assert.ok(strFromU8(unzipSync(out)['xl/workbook.xml']).includes('fullCalcOnLoad="1"'));
});
test('Invalid/duplicate/read-only/unsafe changes rejected before applying', () => {
  const d = inspectOffice(createSpreadsheet([[1]]), 'test.xlsx'), id = d.blocks[0].id;
  for (const c of [ { id: 'unknown', text: '1', valueType: 'number' }, { id, text: 'NaN', valueType: 'number' }, { id, text: '=WEBSERVICE("https://x")', valueType: 'formula' }, { id, text: '=\'[1]Data\'!A1', valueType: 'formula' }, { id, text: '1' } ]) assert.throws(() => validateChanges(d, [c]));
  assert.throws(() => validateChanges(d, [{ id, text: '1', valueType: 'number' }, { id, text: '2', valueType: 'number' }]));
  assert.throws(() => parseXML('<!DOCTYPE a [<!ENTITY x "test">]><a>&x;</a>'));
  assert.throws(() => readPackage(zipSync({ '../evil': strToU8('test') })));
});
test('PPTX creation and text edits preserve slide count and original', async () => {
  const bytes = await createSlides('Báo cáo', [{ title: 'Bìa', body: 'Doanh thu' }, { title: 'Quý 1', body: '1234.56 triệu' }]);
  const d = inspectOffice(bytes, 'test.pptx');
  assert.equal(d.blocks.filter(b => b.slide === 2).length, 3);
  const b = d.blocks.find(b => b.text === '1234.56 triệu');
  const out = applyOfficeChanges(d, [{ id: b.id, text: '2345.67 triệu' }]);
  assert.ok(inspectOffice(out, 'next.pptx').blocks.some(b => b.text === '2345.67 triệu'));
  assert.ok(d.blocks.some(b => b.text === '1234.56 triệu'));
});
test('Context cap signals coverage, không cắt JSON giữa chừng', () => {
  const d = { name: 'x', kind: 'docx', revision: 'r', warnings: [], blocks: Array.from({ length: 1000 }, (_, i) => ({ id: String(i), text: 'a'.repeat(200) })) };
  const context = documentContext(d);
  assert.equal(context.truncated, true); assert.equal(context.totalBlocks, 1000); assert.ok(context.includedBlocks < 1000); assert.doesNotThrow(() => JSON.parse(JSON.stringify(context)));
});
