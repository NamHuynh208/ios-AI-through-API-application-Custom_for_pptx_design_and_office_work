> Cập nhật: 2026-10-30

- Nền tảng: PWA iPhone Safari (không phải SwiftUI/IPA), Vite 7 + JavaScript ES modules, Cloudflare Pages static hosting tại `agenty.namprojects.site`.
- Office Open XML: fflate + @xmldom/xmldom chạy trong Web Worker. PDF: PDF.js đọc text; pdf-lib + fontkit + Roboto tạo/chỉnh trang PDF. PPTX tạo bằng PptxGenJS.
- API: fetch OpenAI-compatible trực tiếp từ browser, HTTPS, không cookie, redirect:error, timeout/cancel; provider cần CORS. Không backend/proxy.
- API key chỉ trong memory của tab; preferences allowlist ở localStorage, history opt-in; tài liệu chỉ trong RAM tới khi người dùng tải/chia sẻ.
- CSP, security headers, service worker cache allowlist. Bản build tĩnh zip trong `release/`, build từ source bằng `npm run release`.
- Files access qua file picker, download, Web Share; app không có quyền duyệt toàn bộ Files.
- Kiểm thử Node tests + Playwright Chromium/WebKit; cần Safari/iPhone vật lý để xác nhận safe-area, file share và install behavior.
