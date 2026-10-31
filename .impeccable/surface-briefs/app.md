# Agenty Mobile — app shell

- Mode: Operate. iPhone-first PWA; người dùng chọn `chat` trong direction round, code-led.
- Tác vụ: chat API riêng; chọn Office/PDF, sửa thủ công hoặc duyệt đề xuất AI, tải/chia sẻ bản mới.
- Không có backend; CORS có thể chặn API. Không nhúng khoá. Giữ file gốc.

## Direction contract

THESIS: Hội thoại trước, nội dung tài liệu và vùng duyệt sửa tìm được ngay qua ba tab tiêu chuẩn; không biến editor thành landing page.

OWN-WORLD: Nền sáng xanh rất nhạt, header navy #172B48, selection cobalt #245BCA, bề mặt trắng; chữ hệ thống iPhone, nút đủ 44px; cảnh báo vàng/đỏ chỉ cho trạng thái thật.

STORY: Người dùng thêm API, gắn file, xem rõ dữ liệu nào được gửi, nhận đề xuất rồi tự duyệt. File gốc không đổi.

FIRST VIEWPORT: Header Agenty ở trên; welcome chat và ba gợi ý văn phòng; composer với đính kèm ở cuối vùng làm việc; nav Tài liệu/Trợ lý/Cài đặt ở dưới safe area. Khi có tài liệu, banner file đặt cạnh vùng nội dung và trạng thái consent rõ.

FORM: Chosen `chat` / pick, sketch `.impeccable/mocks/decision/chat.html`; seed:5c5a97280acde582. Signature: thay đổi AI có cặp Trước/Sau và chỉ chuyển sang trạng thái bản sửa sau khi duyệt.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
