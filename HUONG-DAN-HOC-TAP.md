# Phân hệ học tập, quán triệt — phiên bản 2.9

## Thiết lập một lần

Giữ nguyên hai biến SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY đang dùng trong Vercel. Không đưa khóa hoặc mật khẩu lên GitHub. Không chạy lại 001-mock.sql.

1. Mở Supabase vptct-thi-thu > SQL Editor. Mở file supabase/002-learning.sql trong gói, sao chép toàn bộ, dán vào SQL Editor và Run. Script tạo các bảng riêng, phân quyền và bucket learning-private; không sửa dữ liệu thi thử.
2. Mở Authentication > Users > Add user > Create new user. Nhập email định danh nội bộ **admin@vptct.internal**, tự đặt mật khẩu riêng (tối thiểu 10 ký tự), bật **Auto Confirm User**, rồi tạo. Đây là định danh đăng nhập, không cần hộp thư thật. Không dùng Invite và không gửi mật khẩu vào chat.
3. Quay lại SQL Editor, chạy toàn bộ file **supabase/003-grant-learning-admin.sql**. Script chỉ cấp admin cho đúng tài khoản ở bước 2. Nếu chưa tạo hoặc chưa xác nhận tài khoản, script sẽ báo lỗi thay vì cấp quyền nhầm.
4. Upload toàn bộ nội dung gói 2.9 vào gốc repo quiz-vptct-v2, commit main. Chờ Vercel **ontap-vptct** Ready.
5. Mở website > Đăng nhập đảng viên. Tên đăng nhập: **admin**. Mật khẩu: mật khẩu anh tự đặt ở bước 2. Chọn **Quản trị**.
6. Tạo tài khoản từng đảng viên trước khi phát hành đợt đầu tiên. Tên đăng nhập dùng chữ thường không dấu, số, dấu chấm/gạch; mỗi người mật khẩu riêng. Admin không hiển thị lại mật khẩu, nhưng có thể đặt lại hoặc khóa tài khoản. Tài khoản quản trị dùng để quản lý; nếu admin cũng nghiên cứu, tạo thêm tài khoản đảng viên riêng để xác nhận.

Sau bước này không cần vào Supabase để tạo tài khoản hoặc đăng tài liệu hằng ngày. Người không nằm trong bảng tài khoản hoạt động không được truy cập tài liệu dù có tài khoản Auth. Không có tính năng tự đăng ký hoặc tự nâng quyền.

## Tạo và triển khai một đợt

1. Nhập tên, năm học tập và hướng dẫn/chỉ đạo triển khai; lưu nháp.
2. Thêm tài liệu theo thứ tự. PDF tối đa 20 MB/tệp; hoặc soạn/dán nội dung tối đa 100.000 ký tự. Phần soạn giữ xuống dòng, đoạn và số mục dưới dạng văn bản thuần, không chạy mã HTML. Bản tóm tắt phải được rà soát trước phát hành. Chỉ đưa tài liệu được chỉ đạo, được phép phổ biến và không mật.
3. Bấm Đọc tài liệu để kiểm tra. Nội dung văn bản nháp có nút Sửa nội dung. Sau khi phát hành, không sửa bộ tài liệu; nếu thay đổi nội dung thì tạo đợt mới.
4. Phát hành: giao cho toàn bộ tài khoản đảng viên đang hoạt động lúc phát hành. Tài khoản tạo sau không tự nhận các đợt cũ. Bản đầu chưa có chọn riêng tổ/nhóm.
5. Đảng viên đăng nhập, mở tài liệu, cuộn hết rồi xác nhận. Trang tự mở tài liệu chưa hoàn thành tiếp theo. Sau tài liệu cuối tự ghi hoàn thành cả đợt bằng giờ máy chủ. Cuộn đến cuối không chứng minh đọc hiểu; đây là xác nhận tự giác đã nghiên cứu.
6. Thoát giữa chừng không mất các tài liệu đã xác nhận. Vị trí cuộn trong tài liệu chưa xác nhận chưa được lưu. Phiên đăng nhập khoảng một giờ; nếu hết phiên, đăng nhập lại, kết quả đã xác nhận vẫn còn.

## Thống kê theo năm

Trang chủ sau đăng nhập nhóm các đợt được giao theo năm, năm hiện tại (giờ Việt Nam) mở sẵn, năm khác thu gọn. Bấm tên đợt mở danh sách hoàn thành và giờ xác nhận. Sang năm mới không xóa dữ liệu cũ. Năm học tập được nhập khi tạo nháp, không lấy từ năm hoàn thành của người đọc.

Sau mỗi thao tác của người dùng, dữ liệu được tải lại ngay. Các cửa sổ khác kiểm tra cập nhật mỗi 30 giây khi trang đang mở; bản này chưa dùng kênh Realtime đẩy dữ liệu. Khách chưa đăng nhập không nhận danh sách tên hoặc tài liệu.

## Xóa nội dung sau đợt học tập

Đóng đợt trước, rồi chọn Xóa nội dung ở từng tài liệu. Có hộp xác nhận. Tệp PDF được xóa khỏi Storage; văn bản soạn được xóa khỏi nội dung lưu. Tên đợt, năm, tên tài liệu, đảng viên và các thời điểm xác nhận vẫn được giữ. Người chưa hoàn thành không xác nhận thêm sau khi đóng. Xóa nội dung không thể khôi phục bằng giao diện; tải/lưu bản gốc riêng trước nếu cần. Đóng đợt không tự xóa tệp.

## Dung lượng và giới hạn

- Supabase Free hiện công bố 1 GB lưu trữ tệp, 500 MB dữ liệu cơ sở dữ liệu và tối đa 50 MB/tệp ở cấp nền tảng. Bản này chủ động giới hạn PDF 20 MB để đọc thuận tiện. Các hạn mức dùng chung với dữ liệu dự án hiện tại, không phải mỗi tài khoản được một phần riêng.
- Không giới hạn cố định số tài liệu theo năm trong giao diện; dung lượng và lưu lượng tải xuống của gói hosting vẫn áp dụng. 50 tệp khoảng 20 MB đã gần 1 GB, chưa kể tệp khác.
- File tải trực tiếp từ trình duyệt quản trị lên Storage riêng tư bằng đường dẫn có hạn, không đẩy tệp qua giới hạn nội dung yêu cầu của Vercel. Chỉ admin được xin đường tải lên.
- PDF đọc ngay trong website bằng PDF.js đóng gói nội bộ; không gửi tài liệu sang dịch vụ xem tệp bên thứ ba. PDF có mật khẩu cần bỏ mật khẩu hoặc thay bằng bản được phép đọc trước khi tải lên.
- Quyền xem tệp dùng đường dẫn có thời hạn một giờ; người đã mở tài liệu có thể đã tải bản sao. Đóng tài khoản/xóa tệp không thu hồi các bản sao đã tải.
- Đọc giới hạn hiện hành: https://supabase.com/pricing và https://supabase.com/docs/guides/storage/uploads/file-limits . Bản tóm tắt ChatGPT là nội dung do admin chuẩn bị bên ngoài; website không tự gọi ChatGPT/API và không phát sinh phí AI.

## Kiểm tra trước sử dụng thật

Đã kiểm tra build, SQL bằng PGlite, phân quyền và luồng đọc văn bản/PDF qua trình duyệt với dữ liệu kiểm thử. Chưa cấu hình hoặc kiểm thử trên Supabase thật của anh. Sau cài đặt, tạo một đợt TEST có 3 tài liệu, một tài khoản đảng viên TEST; kiểm tra đăng nhập, upload PDF, xác nhận đủ tài liệu, danh sách trên trang chủ, đóng đợt và xóa nội dung. Sau kiểm tra khóa tài khoản TEST và đóng đợt TEST. Không dùng tên hoặc kết quả minh họa làm hồ sơ thực tế.
