import { PDFDocument, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { LIMITS } from './office.js';

let pdfjs;
async function reader() {
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist');
    const { default: workerURL } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerURL;
  }
  return pdfjs;
}
export async function inspectPDF(bytes, name) {
  const lib = await reader();
  const task = lib.getDocument({ data: new Uint8Array(bytes).slice(), isEvalSupported: false, stopAtErrors: true, useSystemFonts: true });
  let pdf;
  try {
    pdf = await task.promise;
    if (pdf.numPages > 100) throw new Error('PDF quá 100 trang. Hãy chia nhỏ trước khi mở trên iPhone.');
    const blocks = [], scanned = [];
    let chars = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), content = await page.getTextContent();
      const text = content.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('').trim();
      chars += text.length;
      if (chars > 1000000) throw new Error('Lớp chữ PDF quá lớn để xử lý trên iPhone.');
      if (text.length < 25) scanned.push(i);
      blocks.push({ id: `pdf:${i}`, label: `Trang ${i}`, text, page: i, type: 'text', readOnly: true });
      page.cleanup();
    }
    return { name, kind: 'pdf', bytes: new Uint8Array(bytes).slice(), pageCount: pdf.numPages, blocks, revision: crypto.randomUUID(), warnings: ['PDF: chỉ đọc lớp chữ, sắp xếp/xoay trang và thêm chữ. Không chỉnh sửa chữ gốc; chưa có OCR ảnh scan.', ...(scanned.length ? [`Trang ít/không có lớp chữ: ${scanned.join(', ')}. Nội dung ảnh chưa được đọc; không coi đây là bản trích đầy đủ.`] : [])] };
  } finally { await task.destroy(); }
}

export function parsePageOrder(input, count) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Nhập thứ tự trang, ví dụ 3,1 hoặc 1-3.');
  const pages = [];
  for (const part of input.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Thứ tự trang chỉ dùng số, dấu phẩy và khoảng tăng dần, ví dụ 1-3,5.');
    const from = Number(match[1]), to = Number(match[2] || match[1]);
    if (from < 1 || to > count || to < from) throw new Error(`Trang phải nằm trong 1–${count}, khoảng tăng dần.`);
    for (let n = from; n <= to; n++) pages.push(n);
    if (pages.length > 100) throw new Error('Tối đa 100 trang đầu ra.');
  }
  return pages;
}
async function fontFor(pdf) {
  const url = import.meta.env.BASE_URL + 'fonts/Roboto-Regular.ttf';
  const r = await fetch(url);
  if (!r.ok) throw new Error('Không tải được font tiếng Việt. Mở lại ứng dụng khi có mạng để cache tài nguyên.');
  pdf.registerFontkit(fontkit);
  return pdf.embedFont(await r.arrayBuffer(), { subset: true });
}
export async function editPDF(document, { order, rotation = 0, overlay = null }) {
  const pages = Array.isArray(order) ? order : parsePageOrder(order, document.pageCount);
  if (!pages.length || pages.length > 100 || pages.some(p => !Number.isInteger(p) || p < 1 || p > document.pageCount) || ![0, 90, 180, 270].includes(rotation)) throw new Error('Thứ tự trang hoặc góc xoay không hợp lệ.');
  const source = await PDFDocument.load(document.bytes.slice());
  const dest = await PDFDocument.create();
  for (const [index, p] of (await dest.copyPages(source, pages.map(n => n - 1))).entries()) {
    p.setRotation(degrees((p.getRotation().angle + rotation) % 360)); dest.addPage(p);
    if (overlay && index === overlay.page - 1) {
      if (typeof overlay.text !== 'string' || overlay.text.length > 3000 || !Number.isFinite(overlay.x) || !Number.isFinite(overlay.y) || overlay.x < 0 || overlay.y < 0 || overlay.x > p.getWidth() || overlay.y > p.getHeight()) throw new Error('Vị trí/chữ thêm vào PDF không hợp lệ.');
      const font = await fontFor(dest);
      p.drawText(overlay.text, { x: overlay.x, y: overlay.y, size: 12, font, color: rgb(.07, .2, .17), maxWidth: p.getWidth() - overlay.x - 12 });
    }
  }
  if (overlay && (!Number.isInteger(overlay.page) || overlay.page < 1 || overlay.page > pages.length)) throw new Error('Trang thêm chữ không có trong PDF đầu ra.');
  return dest.save();
}
export async function createPDF(title, body) {
  if (!title.trim() || body.length > 50000) throw new Error('Cần tiêu đề; PDF mới tối đa 50.000 ký tự.');
  const pdf = await PDFDocument.create(), font = await fontFor(pdf);
  const width = 595.28, height = 841.89, margin = 48, lineHeight = 19;
  let page = pdf.addPage([width, height]), y = height - margin;
  const write = (text, size) => {
    for (const paragraph of text.split('\n')) {
      let line = '';
      const tokens = paragraph.split(/(\s+)/).flatMap(word => font.widthOfTextAtSize(word, size) > width - margin * 2 ? Array.from(word) : [word]);
      const flush = () => { if (y < margin + lineHeight) { page = pdf.addPage([width, height]); y = height - margin; } page.drawText(line, { x: margin, y, font, size, color: rgb(.07, .2, .17) }); y -= lineHeight; line = ''; };
      for (const word of tokens) { if (line && font.widthOfTextAtSize(line + word, size) > width - margin * 2) flush(); line += word; }
      flush();
    }
  };
  write(title, 20); y -= 12; write(body, 12); pdf.setTitle(title); return pdf.save();
}
