# Triển khai tại agenty.namprojects.site

## Chuẩn bị

- Bản ứng dụng là PWA static, không có API key, backend hoặc Cloudflare Function.
- Gói upload được tạo từ **nội dung `dist/`**, không từ toàn bộ project.
- Tên project Pages đề xuất: `agenty-mobile`; production branch `main`.
- Subdomain mong muốn: **https://agenty.namprojects.site**.
- Đã tạo project Pages `agenty-mobile`, upload production build và gắn custom domain `agenty.namprojects.site`.
- Dashboard xác nhận custom domain **Active / SSL enabled**. HTTPS, manifest, service worker và security headers đã được kiểm tra bằng request thực.
- Không sửa DNS gốc, mail hoặc subdomain khác.

## Deploy tiếp: Cloudflare Dashboard Direct Upload

1. Đăng nhập https://dash.cloudflare.com bằng tài khoản đang quản lý `namprojects.site`.
2. Vào **Workers & Pages → Create application → Pages → Direct Upload / Upload assets** (tên mục có thể thay đổi).
3. Tạo project `agenty-mobile`. Upload `release/agenty-mobile-cloudflare.zip` hoặc kéo **nội dung thư mục `dist`** vào vùng upload.
4. Chọn Deploy. Mở địa chỉ `<tên-project-thực>.pages.dev`, kiểm tra trang chạy.
5. Trong project vừa tạo: **Custom domains → Set up a custom domain** → nhập `agenty.namprojects.site`.
6. Chọn zone `namprojects.site` và xác nhận bản ghi DNS Cloudflare đề xuất. Nếu đã có bản ghi `agenty`, dừng và kiểm tra trước khi thay, không ghi đè dịch vụ khác.
7. Đợi custom domain/certificate báo **Active**, rồi mở https://agenty.namprojects.site trên Safari iPhone.
8. Safari → Chia sẻ → **Thêm vào Màn hình chính** → mở Agenty → Cài đặt API/model.

**Phải thêm domain trong Pages trước**, không chỉ tự tạo CNAME ngoài mục Custom domains. Cloudflare sẽ đề xuất CNAME từ `agenty` tới tên project `.pages.dev` thực tế. Không dùng tên `.pages.dev` giả định nếu Cloudflare cấp tên khác.

Direct Upload và Git integration là hai loại project khác nhau; không chuyển trực tiếp từ Direct Upload sang Git integration được. Nếu muốn tự deploy mỗi lần push sau này, tạo project Git integration mới và chuyển domain có kiểm soát.

## Nếu dùng Wrangler từ máy phát triển

Chỉ chạy sau khi chủ tài khoản chấp thuận và đăng nhập; không dán token vào source/chat:

```powershell
cd "D:\Project\GPT API IOS"
npm run build
npx wrangler login
npx wrangler pages project create agenty-mobile --production-branch main
npx wrangler pages deploy dist --project-name agenty-mobile --branch main
```

Sau deploy, thêm custom domain bằng Dashboard như trên. Không tự tạo project trùng nếu `agenty-mobile` đã tồn tại.

## CORS cho nhà cung cấp AI

Origin sản xuất là:

```text
https://agenty.namprojects.site
```

Provider cần cho origin này gọi `GET /models`, `POST /chat/completions`, xử lý `OPTIONS` và cho header `Authorization, Content-Type`. `Access-Control-Allow-Origin` không có dấu `/` cuối.

Cloudflare Pages **không sửa được CORS của API bên thứ ba** chỉ bằng DNS hoặc `_headers`. Không thêm proxy công cộng và không nhúng API key vào deployment. Nếu provider không hỗ trợ browser CORS thì app client-only không kết nối được provider đó.

## Sau triển khai phải kiểm tra

- HTTPS hợp lệ, custom domain Active, không vòng redirect.
- Mở app → có ba tab; thử tạo DOCX/PDF giả rồi tải/chia sẻ vào Files.
- API key không có trong source/build; nhập trong phiên iPhone. `/models` không thay thế kiểm tra chat.
- iPhone có thể xoá RAM/tab khi chuyển app; lưu tài liệu ra Files trước khi đóng.
- Tắt mạng sau lần tải thành công: mở lại được app/tạo tài liệu đơn giản; AI cần mạng.
- Khi đổi bản build, đóng và mở lại PWA để service worker mới có cơ hội active. Không xoá cache/browser storage khi đang có bản sửa chưa lưu.
- Host/Cloudflare quản lý có thể thay JS; chỉ nhập API key nếu bạn tin quyền truy cập host này.

Tham khảo chính thức: https://developers.cloudflare.com/pages/get-started/direct-upload/ và https://developers.cloudflare.com/pages/configuration/custom-domains/.
