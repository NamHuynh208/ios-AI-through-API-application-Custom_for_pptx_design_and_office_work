# AI Office Assistant for iPhone

**Agenty Mobile** is an iPhone-first AI assistant for editing Word, Excel, PowerPoint, and PDF files with your own API key.

PWA chạy trên Safari/iPhone, dùng API OpenAI-compatible của bạn. **Không phải app native, file IPA hoặc bản App Store.** Người dùng chọn không dùng backend xử lý riêng, nên việc đọc/chỉnh file diễn ra trên thiết bị; chỉ nội dung được xác nhận mới gửi tới API AI.

## Chức năng bản 0.1.0

| Định dạng | Làm được | Giới hạn quan trọng |
|---|---|---|
| Word `.docx` | Tạo tài liệu chữ; đọc đoạn/bảng/header/footer; sửa đoạn; AI đề xuất thay chữ/điền mẫu; xuất bản mới | Không phải trình dàn trang Word. Phần Track Changes chỉ đọc. Không đảm bảo bố cục khi chữ dài; không đọc hết hình/textbox/đối tượng nhúng. |
| Excel `.xlsx` | Tạo bảng TSV; đọc ô, kiểu, formula/cache/format; sửa ô có kiểu rõ ràng; đề xuất AI; xuất file mới | Chỉ sửa ô đã có trong XML. Không thêm sheet/hàng/cột trong editor. Không có engine tính công thức; xoá cache công thức khi sửa để Excel tính lại, thay vì giữ số cũ sai. Không cho tạo công thức DDE/URL/external workbook. |
| PowerPoint `.pptx` | Tạo slide chữ đơn giản; đọc và sửa chữ slide; đề xuất AI; giữ hình/biểu đồ có sẵn | Không chỉnh dữ liệu chart/SmartArt, không render slide hoặc tự chống tràn chữ tương đương Office. |
| PDF `.pdf` | Đọc lớp chữ theo trang; tạo PDF tiếng Việt; đổi thứ tự/bỏ/nhân trang; xoay trang; thêm chữ overlay | Không OCR scan, không sửa/xoá chữ PDF gốc, không chỉnh bố cục như Word. |

- Chat tiếng Việt, API endpoint/model tuỳ chọn, lấy danh sách `/models`, dừng request.
- AI chỉ trả đề xuất JSON với ID mục hiện có; app kiểm tra và hiển thị trước/sau. Chỉ áp dụng khi người dùng duyệt.
- Không `exec`, không `eval`, không chạy Python/code từ AI, không tự truy cập file máy.
- Khoá API chỉ nằm trong bộ nhớ tab, **không ghi vào localStorage, build hoặc log**. Tải lại trang phải nhập lại. Đây là lựa chọn an toàn đơn giản, không phải Keychain.
- Tối đa 15 MB/file, 20.000 đoạn/ô, PDF 100 trang; ngữ cảnh AI có giới hạn và báo rõ độ bao phủ. Office giải nén/XML chạy trong Web Worker.
- Giao diện sáng/tối, file picker, tải xuống và Web Share nếu trình duyệt hỗ trợ; cache tài nguyên tĩnh offline sau lần mở thành công.

## Chạy thử trên Windows

Yêu cầu Node.js 22.12+ hoặc 24 LTS và npm.

```powershell
cd "D:\Project\GPT API IOS"
npm ci
npm run dev
```

Mở `http://localhost:5173` trên máy tính. Dev server chỉ phục vụ file ứng dụng, không có endpoint xử lý tài liệu/API proxy. Có thể dừng bằng Ctrl+C ở terminal chạy server.

**Không mở `index.html` bằng double-click/file://.** ES modules, worker và service worker cần web origin.

## Đưa lên iPhone

**Tên miền dự kiến:** `https://agenty.namprojects.site`, dùng Cloudflare Pages. Xem `CLOUDFLARE.md` để upload và gắn custom domain; `npm run release` tạo `release/agenty-mobile-cloudflare.zip`. Chưa coi domain là đang hoạt động trước khi deploy/certificate được xác minh.

1. Build:
   ```powershell
   npm run build
   ```
2. Đưa **nội dung thư mục `dist/`** lên một static host HTTPS mà bạn kiểm soát: GitHub Pages, Cloudflare Pages, Netlify hoặc host riêng. Không có API key trong thư mục này. Không cần backend đọc file, nhưng vẫn cần host phân phối HTML/JS/font.
3. Với GitHub Pages: có thể tạo repo mới, đưa thư mục `dist` lên nhánh `gh-pages`, rồi Settings → Pages → chọn nhánh đó. Không push cả `node_modules`, file dữ liệu hoặc API key. Dự án chưa tự tạo repo hoặc triển khai thay bạn.
4. Mở URL HTTPS bằng **Safari trên iPhone** → nút Chia sẻ → **Thêm vào Màn hình chính** → mở Agenty.
5. Vào Cài đặt, nhập endpoint HTTPS, khoá API và tên model hỗ trợ `/chat/completions`.
6. Chọn file từ Files/iCloud Drive. Chỉnh thủ công hoặc đồng ý gửi nội dung để dùng AI. Sau khi duyệt, **Tải bản hiện tại** hoặc **Chia sẻ → Lưu vào Tệp**.

HTTP qua địa chỉ IP LAN chỉ hữu ích thử một số luồng, không đủ điều kiện cài/offline PWA như HTTPS. Không thể dùng `localhost` của máy tính làm địa chỉ trên iPhone.

### Điều kiện bắt buộc của API: CORS

Client-only không thể bỏ qua chính sách CORS. Nhà cung cấp cần cho origin ứng dụng truy cập qua HTTPS, gồm preflight `OPTIONS` và:

```text
Access-Control-Allow-Origin: https://dia-chi-host-cua-ban.example
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

`*` cũng có thể dùng nếu provider cho phép và không dùng cookie. App gửi Bearer token, không gửi cookie; redirect bị từ chối để tránh chuyển khoá sang host khác. `/models` thành công không đảm bảo model chat hoạt động.

Nếu endpoint dùng trên app Windows nhưng chặn browser CORS, **PWA này không gọi được**. Bạn cần provider bật CORS hoặc chuyển sang app native/backend riêng; không có mẹo phía JavaScript giải quyết an toàn điều đó. Không dùng proxy CORS công cộng vì có thể lộ khoá và tài liệu.

## Luồng làm việc

- **Trợ lý:** nhập yêu cầu văn bản, gắn file nếu cần. Với file, xem số mục sẽ gửi và đánh dấu đồng ý; đổi file/phạm vi phải đồng ý lại.
- **Đề xuất sửa:** nhập yêu cầu cụ thể như “Thay Nguyễn Văn An bằng Nguyễn Văn Bình, không đổi nội dung còn lại”; bấm Đề xuất chỉnh sửa file bằng AI → kiểm tra Trước/Sau → Áp dụng.
- **Tài liệu:** tìm/chọn các đoạn/ô để chỉ gửi phạm vi cần thiết; sửa tay không cần API. Hiển thị 40 mục/lần, không có nghĩa chỉ đọc 40 mục.
- **Tạo mới:** Word/PDF dùng text, Excel dùng TSV (tab-separated), PPTX dùng dòng `---` chia slide. Nội dung có thể soạn với AI rồi dán vào mẫu tạo file; chat không tự sinh file bằng code.
- **Excel mới:** chuỗi giữ nguyên kể cả `00123` hoặc bắt đầu `=`. Muốn ô số/công thức, chọn sửa ô rồi chọn kiểu rõ ràng. Mở Excel để tính công thức lại.
- **PDF:** thứ tự `3,1` xuất trang 3 trước trang 1; `1-3,5` giữ trang 1–3 và 5. Overlay dùng toạ độ point của trang chưa xoay, gốc từ đáy; kiểm tra bản preview.

## An toàn và quyền riêng tư

- App không tự upload file tới host tĩnh, không telemetry. Khi gửi AI, chỉ nội dung trích, tên file và cảnh báo được gửi đến endpoint bạn nhập. Provider có thể lưu/xử lý theo chính sách riêng.
- Bạn phải tin host phân phối app: JavaScript trên origin này có thể truy cập khoá trong bộ nhớ. HTTPS/CSP và không dùng CDN giảm rủi ro, **không biến PWA thành kho bí mật tuyệt đối**.
- Lịch sử tắt mặc định. Nếu bật, tối đa 30 tin được lưu trong localStorage, không mã hoá riêng; có thể chứa dữ liệu nhạy cảm. Tắt/xoá trong Cài đặt để dọn bản cục bộ. File không lưu bền trong app.
- Bản sửa nằm trong RAM cho đến khi bạn tải/chia sẻ. iOS có thể đóng tab khi thiếu bộ nhớ; lưu ra Files thường xuyên. Không dựa vào cảnh báo beforeunload để bảo vệ dữ liệu trên iOS.
- Bản gốc không bị ghi đè. Office có macro/chữ ký số bị từ chối. Không dùng chỉnh file quan trọng mà chưa mở lại bằng Office và đối soát.
- PDF scan không OCR; các trang ít/không có chữ được liệt kê, không giả là đã đọc đủ.
- Khi dừng request, provider có thể vẫn xử lý và tính phí. Không retry trả phí tự động.

## Kiểm thử

```powershell
npm test
npx playwright install chromium webkit
npm run test:browser
npm run build
npm audit
```

Test API dùng dữ liệu giả và HTTP mock; **chưa dùng khoá thật hoặc kiểm tra CORS của nhà cung cấp bạn chọn**. Playwright WebKit trên Windows không thay thế Safari/iPhone thật. Kết quả và checklist được ghi tại `TESTING.md` sau khi hoàn tất.

## Cấu trúc

```text
src/app.js            UI, consent, duyệt đề xuất, chia sẻ/download
src/office.js         Open XML DOCX/XLSX/PPTX và validation thay đổi
src/office.worker.js  giải nén/đọc/ghi Office ngoài main thread
src/pdf.js            PDF.js read text, pdf-lib tạo/sửa trang, font tiếng Việt
src/api.js            HTTPS API, timeout/cancel, CORS/error, JSON proposal
src/storage.js        allowlist settings, opt-in history, không lưu key
src/style.css         mobile-first, safe areas, light/dark, accessibility
scripts/generate-sw.mjs  cache tài nguyên build, không cache API
tests/                unit/integration và browser workflow
public/fonts/         Roboto cho PDF cùng giấy phép Apache-2.0
dist/                 bản build static để triển khai (sinh bởi npm run build)
```

Thư viện và giấy phép tại `THIRD_PARTY_NOTICES.md`. Không tự tạo tài khoản host, publish App Store hoặc triển khai dịch vụ trong nhiệm vụ này.
