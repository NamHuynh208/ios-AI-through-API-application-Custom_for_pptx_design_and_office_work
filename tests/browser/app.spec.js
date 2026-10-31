import { test, expect } from '@playwright/test';
import { createWord, createSpreadsheet, createSlides } from '../../src/office.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';

async function settings(page) {
  await page.getByRole('navigation').getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByLabel('Địa chỉ API OpenAI-compatible').fill('https://qa-api.example/v1');
  await page.getByLabel('Khoá API', { exact: true }).fill('fake_qa_key_only');
  await page.getByLabel('Model chat').fill('qa-model');
  await page.getByRole('button', { name: 'Lưu cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Trợ lý', exact: true }).click();
}
test('small-screen no overflow, chat API, draft preserved, no key in storage, safe text', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://qa-api.example/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ choices: [{ message: { content: '<script>window.evil=true</script> QCODEBLOCK999Q Nguyễn Văn An' } }] }) }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bạn cần hoàn thành/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Yêu cầu cho trợ lý').fill('Bản nháp');
  await settings(page);
  await expect(page.getByLabel('Yêu cầu cho trợ lý')).toHaveValue('Bản nháp');
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(page.locator('.message.assistant')).toContainText('QCODEBLOCK999Q');
  expect(await page.evaluate(() => window.evil)).toBeUndefined();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('fake_qa_key_only');
  expect(errors).toEqual([]);
  await page.screenshot({ path: `.impeccable/review/${test.info().project.name}-chat.png`, fullPage: true });
});
test('Word upload, manual edit and download original retained', async ({ page }) => {
  await page.goto('/');
  const bytes = createWord('Báo cáo', 'Nguyễn Văn An\n1234.56');
  await page.locator('#file-input').setInputFiles({ name: 'bao_cao.docx', mimeType: 'application/octet-stream', buffer: Buffer.from(bytes) });
  await expect(page.locator('.file-info')).toContainText('bao_cao.docx');
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Sửa Đoạn 2', exact: true }).click();
  await page.getByLabel('Nội dung mới', { exact: true }).fill('Nguyễn Văn Bình');
  await page.getByRole('button', { name: 'Tạo bản sửa', exact: true }).click();
  await expect(page.locator('.block')).toContainText(['Báo cáo', 'Nguyễn Văn Bình', '1234.56']);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải bản hiện tại', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('đã sửa');
  await page.screenshot({ path: `.impeccable/review/${test.info().project.name}-word.png`, fullPage: true });
});
test('AI editing requires consent, offers diff, only changes after approval', async ({ page }) => {
  await page.route('https://qa-api.example/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: 'Đổi tên', changes: [{ id: 'word:word/document.xml:1', text: 'Nguyễn Văn Bình' }] }) } }] }) }));
  await page.goto('/'); await settings(page);
  await page.locator('#file-input').setInputFiles({ name: 'qa.docx', mimeType: 'application/octet-stream', buffer: Buffer.from(createWord('QA', 'Nguyễn Văn An')) });
  await page.getByLabel('Yêu cầu cho trợ lý').fill('Đổi An thành Bình');
  await page.getByRole('button', { name: 'Đề xuất chỉnh sửa file bằng AI', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Cần đồng ý');
  await page.getByRole('checkbox', { name: /Tôi đồng ý gửi/ }).check();
  await page.getByRole('button', { name: 'Đề xuất chỉnh sửa file bằng AI', exact: true }).click();
  await expect(page.locator('.proposal')).toContainText('Nguyễn Văn An');
  await expect(page.locator('.proposal')).toContainText('Nguyễn Văn Bình');
  await page.getByRole('button', { name: 'Áp dụng 1 thay đổi', exact: true }).click();
  await expect(page.locator('.proposal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await expect(page.locator('#blocks-list')).toContainText('Nguyễn Văn Bình');
});
test('Excel edit explicit numeric type, no automatic formula execution', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'qa.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(createSpreadsheet([['Mã', 'Tiền'], ['00123', 1234.56]])) });
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Sửa Dữ liệu!B2', exact: true }).click();
  await page.getByLabel('Nội dung mới', { exact: true }).fill('2345.67');
  await page.getByLabel('Kiểu dữ liệu ô').selectOption('number');
  await page.getByRole('button', { name: 'Tạo bản sửa', exact: true }).click();
  await expect(page.locator('#blocks-list')).toContainText('2345.67');
  await expect(page.locator('#blocks-list')).toContainText('00123');
});
test('PPTX on-device creation and reload', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'PowerPoint', exact: true }).click();
  await page.getByLabel('Tiêu đề tài liệu mới').fill('Báo cáo quý');
  await page.getByLabel('Nội dung tài liệu mới').fill('Doanh thu\n123 triệu\n---\nKết luận\nTăng trưởng');
  await page.getByRole('button', { name: 'Tạo file', exact: true }).click();
  await expect(page.locator('#blocks-list')).toContainText('123 triệu');
  await expect(page.locator('#blocks-list')).toContainText('Slide 2');
});
test('PDF import, text extraction, reorder and Vietnamese PDF creation', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) pdf.addPage().drawText(`PAGE_${i}_QA_TEXT_123456789`, { x: 40, y: 500, font });
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await expect(page.locator('#blocks-list')).toContainText('PAGE_3_QA');
  await page.getByText('Sắp xếp, xoay trang hoặc thêm chữ', { exact: true }).click();
  await page.getByLabel('Thứ tự trang PDF').fill('3,1');
  await page.getByRole('button', { name: 'Tạo bản PDF sửa', exact: true }).click();
  await expect(page.locator('.file-info')).toContainText('2 trang');
  expect(await page.locator('.block-text').allTextContents()).toEqual(['PAGE_3_QA_TEXT_123456789', 'PAGE_1_QA_TEXT_123456789']);
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await page.getByLabel('Tiêu đề tài liệu mới').fill('Báo cáo tiếng Việt');
  await page.getByLabel('Nội dung tài liệu mới').fill('Nguyễn Văn An – 1234.56 đồng');
  await page.getByRole('button', { name: 'Tạo file', exact: true }).click();
  await expect(page.locator('#blocks-list')).toContainText('Nguyễn Văn An');
  expect(errors).toEqual([]);
});
test('invalid API output does not modify file and keeps draft', async ({ page }) => {
  await page.route('https://qa-api.example/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ choices: [{ message: { content: '{"summary":"bad","changes":[{"id":"unknown","text":"oops"}]}' } }] }) }));
  await page.goto('/'); await settings(page);
  await page.locator('#file-input').setInputFiles({ name: 'qa.docx', mimeType: 'application/octet-stream', buffer: Buffer.from(createWord('QA', 'Original')) });
  await page.getByRole('checkbox', { name: /Tôi đồng ý gửi/ }).check();
  await page.getByLabel('Yêu cầu cho trợ lý').fill('Sửa file');
  await page.getByRole('button', { name: 'Đề xuất chỉnh sửa file bằng AI', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('không thuộc tài liệu');
  await expect(page.getByLabel('Yêu cầu cho trợ lý')).toHaveValue('Sửa file');
});
test('cancel API does not commit late answer, keeps draft', async ({ page }) => {
  let reply;
  await page.route('https://qa-api.example/**', async route => { await new Promise(resolve => { reply = resolve; }); try { await route.fulfill({ status: 200, contentType: 'application/json', body: '{"choices":[{"message":{"content":"LATE"}}]}' }); } catch {} });
  await page.goto('/'); await settings(page);
  await page.getByLabel('Yêu cầu cho trợ lý').fill('Huỷ thử');
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dừng yêu cầu API', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dừng yêu cầu API', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Đã dừng');
  await expect(page.getByLabel('Yêu cầu cho trợ lý')).toHaveValue('Huỷ thử');
  reply?.();
  await expect(page.locator('.message.assistant')).toHaveCount(0);
});
test('bulk clear selection revokes upload consent', async ({ page }) => {
  await page.goto('/'); await settings(page);
  await page.locator('#file-input').setInputFiles({ name: 'qa.docx', mimeType: 'application/octet-stream', buffer: Buffer.from(createWord('QA', 'Private rest')) });
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Chọn Đoạn 1', exact: true }).check();
  await page.getByRole('button', { name: 'Trợ lý', exact: true }).click();
  await page.getByRole('checkbox', { name: /Tôi đồng ý gửi/ }).check();
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ chọn', exact: true }).click();
  await page.getByRole('button', { name: 'Trợ lý', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Tôi đồng ý gửi/ })).not.toBeChecked();
});
test('creating async file blocks competing open until completion', async ({ page }) => {
  let release;
  await page.route('**/fonts/Roboto-Regular.ttf', async route => { await new Promise(resolve => { release = resolve; }); await route.continue(); });
  await page.goto('/'); await page.getByRole('button', { name: 'Tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await page.getByLabel('Tiêu đề tài liệu mới').fill('Creating');
  await page.getByLabel('Nội dung tài liệu mới').fill('QA');
  await page.getByRole('button', { name: 'Tạo file', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đang tạo…', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await page.getByRole('button', { name: 'Mở file', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Chờ thao tác hiện tại');
  release?.();
  await expect(page.locator('.file-info')).toContainText('Creating.pdf', { timeout: 20000 });
});
test('mobile home/settings light-dark and narrow layout captures', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: `.impeccable/review/${test.info().project.name}-home.png`, fullPage: true });
  expect(await page.locator('#file-input').isVisible()).toBe(false);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const input = page.getByLabel('Yêu cầu cho trợ lý'); await input.scrollIntoViewIfNeeded();
    const box = await input.boundingBox(), nav = await page.locator('.bottom-nav').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(nav.y + 1);
  }
  await page.screenshot({ path: '.impeccable/review/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('navigation').getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('combobox', { name: 'Giao diện', exact: true }).selectOption('dark');
  await page.getByLabel('Model chat').fill('qa');
  await page.getByRole('button', { name: 'Lưu cài đặt', exact: true }).click();
  await page.screenshot({ path: `.impeccable/review/${test.info().project.name}-settings-dark.png`, fullPage: true });
});
