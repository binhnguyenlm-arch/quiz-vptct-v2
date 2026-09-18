# CẬP NHẬT 2.11.0 — ĐẢNG VIÊN VÀ QUẦN CHÚNG

## 1. Cập nhật dữ liệu trước
Trong Supabase của dự án đang dùng, mở SQL Editor → dấu + tạo truy vấn mới. Mở tệp `supabase/008-audiences-retention.sql` trong gói này, sao chép toàn bộ và dán vào truy vấn mới, bấm Run. Chờ “Success. No rows returned”.

Tệp này dành cho hệ thống đã cài các bản SQL 001–007. Không chạy lại các tệp cũ. Có thể chạy lại 008 nếu cần. Tài khoản cũ được mặc định là Đảng viên; thứ tự tài khoản cũ được lấy từ thời điểm tạo trong Supabase Authentication.

SQL có thao tác dọn dữ liệu: bài thi 20/50 câu đã kết thúc quá 1 giờ được xóa chi tiết; bài 100 câu giữ kết quả xếp hạng và bỏ câu hỏi/đáp án cũ. Tổng lượt học và số trang quy đổi vẫn giữ. Nếu Supabase hiện cảnh báo “destructive operations”, đây là phần dọn dữ liệu này; hãy kiểm tra đang chạy đúng tệp 008.

## 2. Cập nhật website
Giải nén gói, tải toàn bộ các thư mục và tệp bên trong lên kho GitHub như những lần trước. Chờ Vercel triển khai thành công rồi tải lại website. Không tải tệp ZIP nguyên khối vào kho thay cho mã nguồn.

## 3. Phân loại người học
Đăng nhập admin → Quản trị → Tài khoản đảng viên và quần chúng. Mỗi tài khoản có ô Phân loại: Đảng viên / Quần chúng; đổi lựa chọn để lưu. Khi tạo tài khoản mới cũng chọn phân loại. Quyền admin được giữ riêng, không bị thay đổi bởi phân loại này.

Danh sách tra cứu trước đăng nhập lấy từ tài khoản thực tế đang hoạt động. Đảng viên ở trên, quần chúng ở dưới; trong từng nhóm giữ thứ tự tạo tài khoản, không xếp theo thành tích. Cột Lượt học nghị quyết tính số đợt đã hoàn thành, không cộng trùng học lại; đợt đã bị xóa không còn tính trong cột này. Không hiển thị mật khẩu.

## 4. Chọn đối tượng và cấp bổ sung
Khi tạo đợt, chọn Đảng viên / Quần chúng / Cả hai. Khi Phát hành, hệ thống giao đợt cho các tài khoản đang hoạt động thuộc nhóm đã chọn.

Với tài khoản mới tạo sau khi phát hành: mở đợt đang triển khai trong Quản trị → Bổ sung người học → chọn tài khoản → Cấp quyền học đợt này. Danh sách chỉ hiện người đúng đối tượng, đang hoạt động và chưa được giao. Nếu không thấy người cần chọn, kiểm tra phân loại và trạng thái tài khoản.

Chỉ admin có quyền cấp bổ sung. Không cấp vào đợt đã đóng. Phân loại mới không tự xóa những lần giao hoặc kết quả đã có trước đó. Người học tải lại trang hoặc chờ chu kỳ 30 giây để thấy đợt vừa được giao.

## 5. Xóa đợt có sự cố
Trong đợt cần xóa → Xóa đợt → đọc và xác nhận. Đợt được ẩn khỏi người học, rồi xóa tệp và danh sách giao/xác nhận/hoàn thành của đợt. Không thể hoàn tác. Các trang đang mở tự cập nhật trong khoảng 30 giây; có thể tải lại để thấy ngay.

Nếu mạng lỗi khi dọn tệp, đợt vẫn bị ẩn; admin bấm Xóa đợt lần nữa để hoàn tất. Tổng thống kê số hóa/xanh hóa tích lũy vẫn được giữ, theo quy tắc tính tổng từ đầu.

## 6. Dữ liệu bài làm
Ôn tập không lưu nội dung/đáp án vào lịch sử máy chủ. Thi 20/50 câu xem kết quả tại phiên hiện tại; khi rời trang hoặc bấm Tiếp tục, hệ thống yêu cầu xóa bài đó. Bài 100 câu giữ điểm, thời gian, tên và dữ liệu xếp hạng, loại bỏ chi tiết câu hỏi/đáp án sau khi rời trang kết quả.

Nếu trình duyệt đóng đột ngột hoặc mất mạng không gửi được yêu cầu, lần truy cập thống kê/thi tiếp theo sẽ dọn kết quả đã quá 1 giờ; bài bỏ dở hết hạn quá 1 ngày cũng được dọn. Bản ghi chống đếm trùng ôn tập được dọn sau 1 ngày. Chỉ giữ bản ghi đếm tối thiểu để tổng lượt học và giấy tiết kiệm không bị giảm hoặc tăng trùng.

Các đợt ở trang chủ mặc định thu gọn theo năm và theo đợt.
