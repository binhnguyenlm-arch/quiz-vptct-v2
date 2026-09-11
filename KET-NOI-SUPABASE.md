# Kết nối Supabase mới cho Thi thử

Gói 2.2 đã có Ôn tập, Thi thử và mã kết nối bảng xếp hạng. Supabase mới chưa được tạo hoặc cấu hình trong phiên làm việc này, nên Thi thử hiện khóa nút bắt đầu với thông báo chờ kết nối; không đưa ra thành tích giả.

## Bước 1 Tạo dự án mới

Mở https://supabase.com/dashboard và đăng nhập. Tạo New project trong tổ chức của bạn, đặt tên vptct-thi-thu. Chọn khu vực Singapore nếu có. Tạo mật khẩu database mạnh và lưu ở nơi riêng, không gửi mật khẩu vào chat. Chọn gói phù hợp với tài khoản; không cần nâng cấp trả phí chỉ để thử tính năng này. Chờ dự án sẵn sàng.

## Bước 2 Tạo bảng và hàm

Mở SQL Editor của dự án mới. Chép toàn bộ nội dung supabase/001-mock.sql vào một truy vấn mới và Run. Script chỉ tạo bảng vptct_mock_attempts, chỉ mục và hàm vptct_mock trong dự án mới, không nhập dữ liệu demo. Bảng bật RLS; trình duyệt không được quyền đọc hoặc ghi trực tiếp; chỉ máy chủ gọi hàm bằng khóa bí mật.

## Bước 3 Cấu hình Vercel

Trong project Vercel ĐANG DÙNG, thêm hai Environment Variables cho Production (và Preview nếu bạn muốn kiểm tra deployment preview):

SUPABASE_URL = Project URL của dự án Supabase mới.
SUPABASE_SERVICE_ROLE_KEY = khóa service_role của dự án mới, lấy ở phần API keys/Legacy keys trong cài đặt dự án.

Không dùng tiền tố NEXT_PUBLIC cho khóa service_role. Không chép khóa vào GitHub, file ZIP, mã trình duyệt hoặc chat. Nhập trực tiếp trong giao diện Vercel.

## Bước 4 Cập nhật đồng bộ

Upload toàn bộ nội dung ZIP lên root repo quiz-vptct-v2 hiện tại, Commit một lần. Giữ nguyên project, domain và Root Directory. Chờ Vercel Ready. Nếu sửa biến môi trường sau deployment, Redeploy để nhận giá trị mới.

## Bước 5 Kiểm tra kết nối thực

Mở /thi-thu. Khi kết nối thành công, nút Bắt đầu Thi thử hoạt động. Thử gói 20 câu: chọn vài câu, tải lại trang, kiểm tra thời gian vẫn tiếp tục và đáp án còn. Nộp bài để xem kết quả; gói 20 không xếp hạng.

Thử gói 100 câu, nộp bài: kết quả được lưu vào bảng TEST của gói 100. Kiểm tra trang chủ có tên chuẩn hóa và điểm. Thi lại kết quả kém hơn không thay thành tích tốt nhất. Tạo một hồ sơ ở trình duyệt khác để kiểm tra bảng dùng chung. Đây là bước kiểm tra cần hoàn tất trên tài khoản mới, chưa được xác nhận từ kiểm tra local.

## Quy tắc sử dụng

- Chỉ Ôn tập và Thi thử, không tổ chức thi thật.
- Gói ban đầu: 20 câu/15 phút, 50 câu/30 phút, 100 câu/60 phút. Gói lớn nhất đang mở và đủ câu trong ngân hàng mới tính xếp hạng.
- Cấu hình ở lib/mock.ts. Muốn chỉ xếp hạng gói 50, tắt gói 100. Mở lại gói 100 thì bảng hiện tại chuyển sang gói 100. Số câu ngân hàng không tự quyết định số câu của gói.
- Khi đổi số câu, thời gian hoặc ngân hàng, dùng ID gói/phiên bản ngân hàng mới để không trộn điều kiện. Kết quả cũ vẫn giữ theo board trong dữ liệu, chưa có giao diện tra cứu lịch sử/Admin.
- Điểm là số câu đúng; cùng điểm ưu tiên thời gian ngắn hơn; cùng cả hai thì đồng hạng. Mỗi hồ sơ trình duyệt chỉ lấy thành tích tốt nhất trong một bảng. Top 3 dựa trên thứ hạng chung, không phải dữ liệu mẫu.
- Chuẩn hóa khoảng trắng, Unicode và hoa đầu từ. Không tự đoán dấu, không xác minh tên thật. Hồ sơ nhận bằng cookie máy chủ: hai người trùng tên không tự động gộp; dùng chung trình duyệt sẽ dùng chung hồ sơ. Đổi máy hoặc xóa cookie có thể tạo hồ sơ khác. Đây là giới hạn của thiết kế không đăng nhập.
- Thứ tự câu và đáp án đều trộn cho mỗi lượt mới. Máy chủ lưu bản câu hỏi và đáp án đã trộn của lượt đó, vì vậy tải lại không làm đổi thứ tự.
- Đồng hồ theo thời hạn máy chủ. Trước hạn, nhận đáp án đã gửi; hết hạn chỉ chấm những đáp án máy chủ đã lưu. Tự nộp trên trang khi hết giờ; nếu đóng trang, kết quả được kết thúc khi mở lại và máy chủ thấy đã quá hạn.
- Không hiện đáp án đúng hay giải thích trong phản hồi của lượt đang làm. Lượt đã hoàn thành mới nhận nội dung đối chiếu. Ngân hàng ôn tập là công khai để học, đây không phải hệ thống chống gian lận cho kỳ thi thật.
- Không có bình luận hoặc sao đánh giá. Kết quả có lời động viên; gói xếp hạng có thông báo dẫn đầu/Top 3 khi cải thiện thành tích và có thứ hạng thật.

## Những kiểm tra đã làm và giới hạn

Build và TypeScript; logic tên, trộn đáp án giữ đúng khóa, lấy câu không trùng, gói lớn nhất; chạy SQL bằng PostgreSQL nhúng PGlite: lưu theo phiên bản, chấm một lần, giữ điểm tốt nhất, đồng hạng, phân tách bảng, hết hạn, quyền truy cập. Giao diện được thử với bộ điều hợp API kiểm thử dùng cùng SQL. Không có dự án Supabase thật trong phiên này; kết nối REST xuyên suốt với dự án mới và Vercel vẫn phải kiểm tra sau cấu hình.

Tài liệu Supabase: https://supabase.com/docs/guides/database/functions và https://supabase.com/docs/guides/database/postgres/row-level-security . Khóa máy chủ phải được giữ riêng theo https://supabase.com/docs/guides/database/secure-data .
