import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { DOMParser as XMLParser, XMLSerializer } from '@xmldom/xmldom';

export const LIMITS = Object.freeze({ fileBytes: 15 * 1024 * 1024, expandedBytes: 80 * 1024 * 1024, entries: 2500, edits: 200, contextChars: 65000 });
const NS = { w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', a: 'http://schemas.openxmlformats.org/drawingml/2006/main', s: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
const enc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
export function parseXML(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Không nhận XML có DTD/entity.');
  const errors = [];
  const doc = new XMLParser({ errorHandler: { warning: m => errors.push(m), error: m => errors.push(m), fatalError: m => errors.push(m) } }).parseFromString(text, 'application/xml');
  if (errors.length || !doc.documentElement) throw new Error('Cấu trúc XML của tài liệu không hợp lệ.');
  return doc;
}
const serialize = d => new XMLSerializer().serializeToString(d);
const elements = (d, ns, local) => Array.from(d.getElementsByTagNameNS(ns, local));
const first = (d, ns, local) => elements(d, ns, local)[0];
function ancestor(n, ns, local) {
  for (let p = n.parentNode; p; p = p.parentNode) if (p.namespaceURI === ns && p.localName === local) return p;
  return null;
}

export function readPackage(bytes) {
  let total = 0, count = 0;
  const entries = unzipSync(new Uint8Array(bytes), { filter: f => {
    if (++count > LIMITS.entries || (total += f.originalSize) > LIMITS.expandedBytes) throw new Error('Tài liệu nén quá lớn để xử lý an toàn trên iPhone.');
    if (f.name.includes('..') || f.name.startsWith('/') || f.name.includes('\\')) throw new Error('Đường dẫn trong file nén không an toàn.');
    return true;
  } });
  if (!entries['[Content_Types].xml']) throw new Error('Không phải tài liệu Office Open XML hợp lệ.');
  if (Object.keys(entries).some(p => /vbaProject|_xmlsignatures/i.test(p))) throw new Error('Bản này không chỉnh tài liệu có macro hoặc chữ ký số. Hãy dùng bản sao không macro/chữ ký.');
  return entries;
}
function xml(entries, path) {
  if (!entries[path]) throw new Error(`Thiếu thành phần tài liệu: ${path}`);
  return parseXML(strFromU8(entries[path]));
}
function resolvePart(base, target) {
  const parts = (target.startsWith('/') ? target.slice(1) : base.slice(0, base.lastIndexOf('/') + 1) + target).split('/');
  const out = [];
  for (const s of parts) { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); }
  return out.join('/');
}
function relationships(entries, base) {
  const relPath = base.slice(0, base.lastIndexOf('/') + 1) + '_rels/' + base.slice(base.lastIndexOf('/') + 1) + '.rels';
  if (!entries[relPath]) return new Map();
  return new Map(Array.from(xml(entries, relPath).getElementsByTagName('Relationship')).filter(r => r.getAttribute('TargetMode') !== 'External').map(r => [r.getAttribute('Id'), resolvePart(base, r.getAttribute('Target'))]));
}
function relID(e) { return e.getAttribute('r:id') || e.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'); }

export function inspectOffice(bytes, name) {
  const kind = name.split('.').pop().toLowerCase();
  if (!['docx', 'xlsx', 'pptx'].includes(kind)) throw new Error('Chỉ nhận DOCX, XLSX, PPTX hoặc PDF; không nhận định dạng cũ/macro.');
  const entries = readPackage(bytes), blocks = [], warnings = [];
  if (kind === 'docx') {
    const paths = Object.keys(entries).filter(p => /^word\/(document|header\d+|footer\d+)\.xml$/.test(p)).sort((a, b) => (a === 'word/document.xml' ? -1 : b === 'word/document.xml' ? 1 : a.localeCompare(b)));
    for (const path of paths) {
      const d = xml(entries, path);
      const hasRevisions = elements(d, NS.w, 'ins').length || elements(d, NS.w, 'del').length;
      if (hasRevisions) warnings.push('Có Track Changes. Phần chứa chỉnh sửa theo dõi chỉ đọc, không sửa trong bản này.');
      elements(d, NS.w, 'p').forEach((p, index) => {
        const ts = elements(p, NS.w, 't').filter(t => !ancestor(t, NS.w, 'del'));
        const text = ts.map(t => t.textContent).join('');
        if (!text.trim()) return;
        const readOnly = !!(ancestor(p, NS.w, 'ins') || ancestor(p, NS.w, 'del') || elements(p, NS.w, 'ins').length || elements(p, NS.w, 'del').length);
        blocks.push({ id: `word:${path}:${index}`, label: `${path.includes('header') ? 'Đầu trang' : path.includes('footer') ? 'Chân trang' : 'Đoạn'} ${index + 1}`, text, path, index, type: 'text', readOnly });
      });
    }
    warnings.push('Sửa văn bản giữ các phần Office khác; không có bản xem bố cục in. Văn bản trong hình/textbox phức tạp có thể chỉ đọc một phần.');
  } else if (kind === 'pptx') {
    const presentation = xml(entries, 'ppt/presentation.xml'), rels = relationships(entries, 'ppt/presentation.xml');
    const slideIDs = Array.from(presentation.getElementsByTagName('p:sldId'));
    const paths = slideIDs.map(e => rels.get(relID(e))).filter(Boolean);
    paths.forEach((path, slide) => {
      const d = xml(entries, path);
      elements(d, NS.a, 'p').forEach((p, index) => {
        const text = elements(p, NS.a, 't').map(t => t.textContent).join('');
        if (text.trim()) blocks.push({ id: `slide:${slide}:${index}`, label: `Slide ${slide + 1} · đoạn ${index + 1}`, text, path, index, slide: slide + 1, type: 'text', readOnly: false });
      });
    });
    warnings.push('Chỉ chỉnh chữ trên slide. Giữ hình/biểu đồ sẵn có nhưng chưa render bố cục hoặc đọc dữ liệu biểu đồ/SmartArt; chữ dài có thể tràn khung.');
  } else {
    const workbook = xml(entries, 'xl/workbook.xml'), rels = relationships(entries, 'xl/workbook.xml');
    const strings = entries['xl/sharedStrings.xml'] ? elements(xml(entries, 'xl/sharedStrings.xml'), NS.s, 'si').map(si => elements(si, NS.s, 't').map(t => t.textContent).join('')) : [];
    const styles = entries['xl/styles.xml'] ? xml(entries, 'xl/styles.xml') : null;
    const formats = styles ? new Map(elements(styles, NS.s, 'numFmt').map(e => [e.getAttribute('numFmtId'), e.getAttribute('formatCode')])) : new Map();
    const xfs = styles && first(styles, NS.s, 'cellXfs');
    const styleList = xfs ? Array.from(xfs.childNodes).filter(n => n.nodeType === 1) : [];
    elements(workbook, NS.s, 'sheet').forEach((s, si) => {
      const path = rels.get(relID(s));
      if (!path) throw new Error('Không tìm thấy worksheet trong file Excel.');
      const d = xml(entries, path);
      const protectedSheet = elements(d, NS.s, 'sheetProtection').length > 0;
      elements(d, NS.s, 'c').forEach(c => {
        const addr = c.getAttribute('r'), type = c.getAttribute('t');
        if (!/^[A-Z]{1,3}[1-9]\d{0,6}$/.test(addr)) return;
        const f = first(c, NS.s, 'f'), v = first(c, NS.s, 'v');
        const value = type === 's' ? strings[Number(v?.textContent)] ?? '' : type === 'inlineStr' ? elements(c, NS.s, 't').map(t => t.textContent).join('') : type === 'b' ? (v?.textContent === '1' ? 'TRUE' : 'FALSE') : v?.textContent ?? '';
        const text = f ? '=' + f.textContent : value;
        const fmtID = styleList[Number(c.getAttribute('s') || 0)]?.getAttribute('numFmtId');
        const format = formats.get(fmtID) || ({ '9': '0%', '10': '0.00%', '14': 'date (Excel serial)', '2': '0.00', '4': '#,##0.00' })[fmtID] || '';
        blocks.push({ id: `cell:${si}:${addr}`, label: `${s.getAttribute('name')}!${addr}`, text: String(text), cached: f ? value : undefined, format, path, address: addr, sheet: s.getAttribute('name'), type: 'cell', valueType: f ? 'formula' : type === 's' || type === 'inlineStr' || type === 'str' ? 'text' : type === 'b' ? 'boolean' : 'number', readOnly: protectedSheet || !!(f && (f.getAttribute('t') === 'shared' || f.getAttribute('t') === 'array')) });
      });
      if (protectedSheet) warnings.push(`Sheet ${s.getAttribute('name')} được bảo vệ: chỉ đọc.`);
    });
    warnings.push('Hiện giá trị thô, công thức, cache và format riêng. Không tự tính công thức. Khi sửa, cache công thức bị xoá; mở Excel để tính lại.');
  }
  if (blocks.length > 20000) throw new Error('Quá 20.000 đoạn/ô: hãy chia nhỏ tài liệu trước khi mở trên iPhone.');
  return { name, kind, bytes: new Uint8Array(bytes), entries, blocks, warnings: [...new Set(warnings)], revision: crypto.randomUUID() };
}

export function validateChanges(document, changes) {
  if (!Array.isArray(changes) || !changes.length || changes.length > LIMITS.edits) throw new Error(`Cần 1–${LIMITS.edits} thay đổi.`);
  const byID = new Map(document.blocks.map(b => [b.id, b])), seen = new Set();
  return changes.map(c => {
    if (!c || typeof c.id !== 'string' || typeof c.text !== 'string') throw new Error('Thay đổi cần id và text dạng chuỗi.');
    const b = byID.get(c.id);
    if (!b || b.readOnly || seen.has(c.id)) throw new Error('Thay đổi trùng, chỉ đọc hoặc không thuộc tài liệu đang mở.');
    if (c.text.length > 20000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(c.text)) throw new Error('Nội dung thay đổi quá dài hoặc có ký tự điều khiển không hợp lệ.');
    seen.add(c.id);
    if (document.kind === 'xlsx') {
      if (!['text', 'number', 'formula', 'boolean'].includes(c.valueType)) throw new Error('Chọn rõ kiểu ô: text/number/formula/boolean.');
      if (c.valueType === 'number' && (!c.text.trim() || !Number.isFinite(Number(c.text)))) throw new Error('Ô số cần giá trị hữu hạn dùng dấu chấm thập phân.');
      if (c.valueType === 'boolean' && !['TRUE', 'FALSE'].includes(c.text)) throw new Error('Ô boolean cần TRUE hoặc FALSE.');
      if (c.valueType === 'formula') {
        if (!c.text.startsWith('=') || c.text.length < 2 || /\[|\]|https?:|WEBSERVICE|HYPERLINK|DDE\s*\(|\|/i.test(c.text)) throw new Error('Không nhận công thức liên kết ngoài, DDE, URL hoặc công thức trống.');
      }
    }
    return { id: c.id, text: c.text, ...(document.kind === 'xlsx' ? { valueType: c.valueType } : {}) };
  });
}

// Chỉ thay ký tự trong run liên quan; giữ kiểu chữ ở những run ngoài vùng sửa.
export function replaceRunText(nodes, newText) {
  const old = nodes.map(t => t.textContent).join('');
  if (old === newText || !nodes.length) return;
  let start = 0, suffix = 0;
  while (start < old.length && start < newText.length && old[start] === newText[start]) start++;
  while (suffix < old.length - start && suffix < newText.length - start && old[old.length - 1 - suffix] === newText[newText.length - 1 - suffix]) suffix++;
  const end = old.length - suffix, replacement = newText.slice(start, newText.length - suffix);
  let offset = 0, inserted = false;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], text = n.textContent, from = offset, to = offset + text.length; offset = to;
    const overlaps = from < end && to > start;
    const insertionHere = !inserted && start === end && start >= from && (start < to || i === nodes.length - 1);
    if (!overlaps && !insertionHere) continue;
    n.textContent = text.slice(0, Math.max(0, start - from)) + (!inserted ? replacement : '') + text.slice(Math.max(0, Math.min(text.length, end - from)));
    n.setAttribute('xml:space', 'preserve'); inserted = true;
  }
  if (!inserted && replacement) nodes[nodes.length - 1].textContent += replacement;
}

export function applyOfficeChanges(document, proposed) {
  const changes = validateChanges(document, proposed), entries = { ...document.entries }, edited = new Map();
  for (const c of changes) {
    const b = document.blocks.find(x => x.id === c.id);
    const d = edited.get(b.path) || xml(entries, b.path); edited.set(b.path, d);
    if (document.kind === 'xlsx') {
      const cell = elements(d, NS.s, 'c').find(e => e.getAttribute('r') === b.address);
      for (const child of Array.from(cell.childNodes)) if (child.nodeType === 1 && ['f', 'v', 'is'].includes(child.localName)) cell.removeChild(child);
      cell.removeAttribute('t');
      if (c.valueType === 'text') {
        cell.setAttribute('t', 'inlineStr');
        const is = d.createElementNS(NS.s, 'is'), t = d.createElementNS(NS.s, 't'); t.setAttribute('xml:space', 'preserve'); t.textContent = c.text; is.appendChild(t); cell.appendChild(is);
      } else {
        const tag = c.valueType === 'formula' ? 'f' : 'v';
        const v = d.createElementNS(NS.s, tag);
        v.textContent = c.valueType === 'formula' ? c.text.slice(1) : c.valueType === 'boolean' ? (c.text === 'TRUE' ? '1' : '0') : String(Number(c.text));
        if (c.valueType === 'boolean') cell.setAttribute('t', 'b');
        cell.appendChild(v);
      }
    } else {
      const ns = document.kind === 'docx' ? NS.w : NS.a;
      const p = elements(d, ns, 'p')[b.index];
      replaceRunText(elements(p, ns, 't'), c.text);
    }
  }
  for (const [path, d] of edited) entries[path] = strToU8(serialize(d));
  if (document.kind === 'xlsx') {
    for (const path of Object.keys(entries).filter(p => /^xl\/worksheets\/sheet[^/]*\.xml$/.test(p))) {
      const d = xml(entries, path);
      for (const c of elements(d, NS.s, 'c')) if (first(c, NS.s, 'f')) { const v = first(c, NS.s, 'v'); if (v) c.removeChild(v); }
      entries[path] = strToU8(serialize(d));
    }
    const wb = xml(entries, 'xl/workbook.xml');
    let calc = first(wb, NS.s, 'calcPr');
    if (!calc) { calc = wb.createElementNS(NS.s, 'calcPr'); wb.documentElement.appendChild(calc); }
    calc.setAttribute('fullCalcOnLoad', '1'); calc.setAttribute('forceFullCalc', '1'); calc.setAttribute('calcMode', 'auto');
    entries['xl/workbook.xml'] = strToU8(serialize(wb));
    if (entries['xl/calcChain.xml']) {
      delete entries['xl/calcChain.xml'];
      const relPath = 'xl/_rels/workbook.xml.rels', rels = xml(entries, relPath);
      for (const r of Array.from(rels.getElementsByTagName('Relationship'))) if (r.getAttribute('Type').endsWith('/calcChain')) r.parentNode.removeChild(r);
      entries[relPath] = strToU8(serialize(rels));
      const ct = xml(entries, '[Content_Types].xml');
      for (const r of Array.from(ct.getElementsByTagName('Override'))) if (r.getAttribute('PartName') === '/xl/calcChain.xml') r.parentNode.removeChild(r);
      entries['[Content_Types].xml'] = strToU8(serialize(ct));
    }
  }
  return zipSync(entries);
}

const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function packageFiles(files) { return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(declaration + v)]))); }
const relRoot = 'http://schemas.openxmlformats.org/package/2006/relationships';
const officeRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function contentTypes(overrides) { return `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${overrides.map(([path, type]) => `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.${type}"/>`).join('')}</Types>`; }
export function createWord(title, body) {
  if (!title.trim() || body.length > 100000) throw new Error('Cần tiêu đề và nội dung không quá 100.000 ký tự.');
  const paragraph = (t, bold = false) => `<w:p><w:r><w:rPr>${bold ? '<w:b/><w:sz w:val="36"/>' : '<w:sz w:val="24"/>'}<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">${enc(t)}</w:t></w:r></w:p>`;
  return packageFiles({ '[Content_Types].xml': contentTypes([['word/document.xml', 'wordprocessingml.document.main+xml']]), '_rels/.rels': `<Relationships xmlns="${relRoot}"><Relationship Id="rId1" Type="${officeRel}/officeDocument" Target="word/document.xml"/></Relationships>`, 'word/document.xml': `<w:document xmlns:w="${NS.w}"><w:body>${paragraph(title, true)}${body.split('\n').map(t => paragraph(t)).join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134"/></w:sectPr></w:body></w:document>` });
}
function colName(index) { let s = ''; for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; }
export function createSpreadsheet(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 5000 || rows.some(r => !Array.isArray(r) || r.length > 50)) throw new Error('Bảng mới cần 1–5.000 dòng, tối đa 50 cột.');
  const data = rows.map((row, ri) => `<row r="${ri + 1}">${row.map((v, ci) => {
    const ref = colName(ci) + (ri + 1);
    if (typeof v === 'number') { if (!Number.isFinite(v)) throw new Error('Giá trị số không hợp lệ.'); return `<c r="${ref}"><v>${v}</v></c>`; }
    if (v !== null && typeof v !== 'string' && typeof v !== 'boolean') throw new Error('Ô chỉ được là text, number, boolean hoặc null.');
    if (typeof v === 'boolean') return `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`;
    // Chuỗi bắt đầu = vẫn là text; công thức chỉ được tạo bằng sửa ô có kiểu rõ ràng.
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${enc(v ?? '')}</t></is></c>`;
  }).join('')}</row>`).join('');
  return packageFiles({ '[Content_Types].xml': contentTypes([['xl/workbook.xml', 'spreadsheetml.sheet.main+xml'], ['xl/worksheets/sheet1.xml', 'spreadsheetml.worksheet+xml']]), '_rels/.rels': `<Relationships xmlns="${relRoot}"><Relationship Id="rId1" Type="${officeRel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`, 'xl/workbook.xml': `<workbook xmlns="${NS.s}" xmlns:r="${officeRel}"><sheets><sheet name="Dữ liệu" sheetId="1" r:id="rId1"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>`, 'xl/_rels/workbook.xml.rels': `<Relationships xmlns="${relRoot}"><Relationship Id="rId1" Type="${officeRel}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, 'xl/worksheets/sheet1.xml': `<worksheet xmlns="${NS.s}"><cols><col min="1" max="50" width="22" customWidth="1"/></cols><sheetData>${data}</sheetData></worksheet>` });
}

export async function createSlides(title, slides) {
  if (!Array.isArray(slides) || !slides.length || slides.length > 12 || slides.some(s => !s || typeof s.title !== 'string' || typeof s.body !== 'string' || s.title.length > 90 || s.body.length > 650)) throw new Error('Cần 1–12 slide; tiêu đề tối đa 90 ký tự, nội dung 650 ký tự/slide.');
  const { default: PptxGenJS } = await import('pptxgenjs');
  const p = new PptxGenJS(); p.layout = 'LAYOUT_WIDE'; p.title = title; p.author = 'Agenty Mobile';
  p.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'vi-VN' };
  slides.forEach((s, index) => {
    const sl = p.addSlide(); sl.background = { color: index === 0 ? '174940' : 'F4F7F5' };
    const ink = index === 0 ? 'FFFFFF' : '173E35';
    sl.addText(s.title, { x: .6, y: .65, w: 12, h: 1.4, fontFace: 'Arial', fontSize: 32, bold: true, color: ink, margin: 0, breakLine: false, isTextBox: true, fit: 'shrink' });
    sl.addText(s.body, { x: .6, y: 2.25, w: 11.7, h: 3.9, fontFace: 'Arial', fontSize: 23, color: ink, margin: 0, isTextBox: true, fit: 'shrink', valign: 'top' });
    sl.addText(`${index + 1} / ${slides.length}`, { x: 11.4, y: 6.8, w: 1.2, h: .3, fontSize: 11, color: ink, align: 'right', isTextBox: true });
  });
  return new Uint8Array(await p.write({ outputType: 'arraybuffer' }));
}

export function documentContext(document) {
  const items = document.blocks.map(({ id, label, text, valueType, cached, format, readOnly }) => ({ id, label, text, valueType, cached, format, readOnly }));
  let selected = [], count = 0;
  for (const item of items) {
    const size = JSON.stringify(item).length;
    if (count + size > LIMITS.contextChars) break;
    selected.push(item); count += size;
  }
  return { name: document.name, kind: document.kind, revision: document.revision, totalBlocks: items.length, includedBlocks: selected.length, truncated: selected.length < items.length, warnings: document.warnings, blocks: selected };
}
