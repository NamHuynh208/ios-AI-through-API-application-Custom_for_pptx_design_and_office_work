> Cập nhật: 2026-10-30

- Đã xây dựng Agenty Mobile PWA bằng Vite/JavaScript cho Safari iPhone; người dùng chọn chat-first, không backend riêng, hỗ trợ DOCX/XLSX/PPTX/PDF có giới hạn rõ.
- Đã deploy Cloudflare Pages project `agenty-mobile` tại https://agenty.namprojects.site; Dashboard xác nhận custom domain Active, SSL enabled; HTTPS/manifest/SW/security headers trả 200.
- Bản phát hành `release/agenty-mobile-cloudflare.zip`; hash/metadata trong `release/release-info.json` (zip không track bởi Git).
- Kiểm thử: unit 15/15; browser 22/22 trên Chromium + WebKit; production offline PDF tiếng Việt qua service worker đạt trên cả hai; UI viewport mobile/landscape/desktop không overflow.
- Đã cập nhật tài liệu triển khai Cloudflare, giới hạn API CORS, bảo mật khoá, thao tác file và third-party licenses.
- Tên dự án tiếng Anh: **AI Office Assistant for iPhone**; giữ tên thương hiệu hiển thị Agenty Mobile và Cloudflare project/domain hiện tại.
- Chưa có kiểm thử iPhone/Safari vật lý hoặc API provider/key thật. Người dùng cần mở Safari iPhone và Add to Home Screen; API provider phải bật CORS cho origin production.
- Không tạo app native/IPA/App Store; không nhúng khoá hoặc chạy code model.
