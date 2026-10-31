# AI Office Assistant for iPhone

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Người dùng giao quyền đề xuất; chọn PWA JavaScript/Vite cho iPhone Safari, không cần backend xử lý riêng hoặc Mac để sử dụng.
- Không phải app SwiftUI, IPA hoặc bản phát hành App Store. Static hosting HTTPS vẫn cần để mở/cài PWA; không có server đọc tài liệu.

## Users

- Người dùng iPhone cần trợ lý AI văn phòng tương tự Agenty Windows, nhập API riêng và chỉnh tài liệu ngay trên điện thoại.
- Tên hiển thị trong ứng dụng: Agenty Mobile.

## Product Purpose

- Chọn file, đọc nội dung, yêu cầu AI đề xuất thay đổi có cấu trúc, duyệt rồi xuất bản mới.
- Hỗ trợ cả DOCX, XLSX, PPTX và PDF ở bản đầu, trong phạm vi thao tác an toàn đã triển khai.

## Operating Context

- Chỉ iPhone và API AI; người dùng không chấp nhận backend xử lý file riêng.
- Môi trường phát triển Windows; kiểm tra browser tự động được nhưng chưa có iPhone/Safari thật.
- Ngôn ngữ mặc định tiếng Việt. Tên làm việc Agenty Mobile kế thừa ứng dụng gốc.
- Người dùng có domain namprojects.site trong Cloudflare và đề xuất subdomain agenty.namprojects.site; chuẩn bị Cloudflare Pages, chưa tự nhận đã triển khai.

## Capabilities and Constraints

- DOCX: đọc/sửa văn bản; XLSX: đọc/sửa ô và công thức, không engine tính toán tương đương Excel; PPTX: đọc/sửa chữ slide; PDF: đọc text, sắp xếp/xoay trang, thêm chữ, không sửa trực tiếp text gốc như Word.
- Tạo file mới và xuất bản chỉnh sửa, không ghi đè file gốc. Không hứa tương đương toàn bộ Microsoft Office hoặc Agenty Windows.
- API OpenAI-compatible cần HTTPS và CORS cho origin PWA. Không thể lách CORS bằng app client-only.
- Không nhúng khoá, không thực thi code do model sinh. Khoá mặc định chỉ trong bộ nhớ phiên; lưu lâu dài nếu có phải là tuỳ chọn có giải thích rủi ro browser storage, không gọi đó là Keychain.
- Tài liệu chỉ được gửi đến endpoint đã cấu hình khi người dùng xác nhận; không có telemetry hoặc upload server khác.

## Product Principles

- Mọi thay đổi AI cần kiểm tra cấu trúc và người dùng duyệt trước khi áp dụng.
- Bản gốc được giữ; xuất tệp mới với tên riêng.
- Không tự đoán thông tin thiếu, không báo đã đọc hết khi bị giới hạn.
- Hiển thị rõ cảnh báo về PDF scan, công thức chưa tính lại, bố cục Office chưa render.
