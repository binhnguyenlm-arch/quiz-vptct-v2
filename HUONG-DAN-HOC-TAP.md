# Cập nhật 2.9.8

Nút Vào học tập dùng tông xanh lá cây, cùng kiểu nổi và viền sáng; vẫn dẫn đến danh sách chuyên đề.

Đổi nút Trang chủ trên thanh điều hướng thành Lịch công tác, tông vàng, hiệu ứng nổi và viền sáng. Mở trang /lich-cong-tac với thông báo đang xây dựng, chưa có chức năng lịch. Cập nhật mã nguồn lên GitHub; không có SQL mới so với 2.9.7.

# Cập nhật 2.9.7 — Xóa tài khoản và Học lại

1. Supabase → SQL Editor → truy vấn mới: dán toàn bộ `supabase/006-delete-learning-account.sql`, bấm Run. Cần đã cài các bản SQL trước đó.
2. Tải mã nguồn trong gói này lên GitHub và chờ Vercel triển khai.

Admin: mở Tài khoản đảng viên, bấm Xóa tài khoản và xác nhận. Không cho xóa tài khoản admin. Thông tin đăng nhập bị xóa, hồ sơ học tập cũ được giữ để thống kê. Có thể tạo lại cùng tên đăng nhập sau khi xóa thành công; đó là tài khoản mới, không tự nhận lịch sử hoặc các đợt được giao cho tài khoản cũ. Nếu kết nối gián đoạn khi xóa, tài khoản đã bị khóa và dòng chờ xóa vẫn hiển thị; bấm Xóa tài khoản lần nữa để hoàn tất.

Người học: mở đợt đã hoàn thành, bấm Học lại. Cuộn từng tài liệu đến cuối, bấm Tiếp tục học lại để tự mở tài liệu tiếp theo. Không thay đổi thời gian hoàn thành lần đầu và không cộng trùng số lần học tập. Có thể học lại đợt đã đóng nếu tài liệu còn lưu; tài liệu đã gỡ không khôi phục được qua nút này.

# Cập nhật 2.9.6

Đổi tiêu đề danh sách thành “Danh sách đảng viên đã nghiên cứu nghị quyết”, bỏ tiêu đề phụ, hiển thị bảng STT / Tên / Thời gian hoàn thành lúc. Áp dụng xuyên suốt các trang học tập. Chỉ cần cập nhật mã nguồn GitHub; không có SQL mới nếu đã cài 2.9.5.

# Cập nhật 2.9.5 — Số lần học tập

1. Trong Supabase → SQL Editor, mở truy vấn mới, dán toàn bộ `supabase/005-study-counts.sql` rồi bấm Run. Cần đã chạy các bản 001, 002, 004 trước đó.
2. Giải nén gói 2.9.5, tải toàn bộ nội dung lên GitHub như các lần trước, chờ Vercel triển khai xong.
3. Trang chủ hiển thị “Số lần học tập” dưới từng chuyên đề và từng đợt nghị quyết. Thống kê tự cập nhật khoảng 30 giây.

Chỉ cộng lượt hoàn thành: Ôn tập sau khi bấm Kết thúc và xem kết quả; Thi thử khi đã nộp hoặc kết thúc được máy chủ ghi nhận; nghị quyết khi hoàn thành toàn bộ đợt. Không đếm truy cập hay bắt đầu học. Một đảng viên/đợt tính một lần kể cả bổ sung tài liệu, dựa vào hồ sơ hoàn thành hiện tại và lịch sử. Tổng chuyên đề cộng Ôn tập và Thi thử; không phân biệt gói nhỏ/lớn hay điểm số. Xem lại kết quả không tăng số.

Lượt Thi thử và nghị quyết lấy từ dữ liệu đã lưu, gồm cả lịch sử. Ôn tập chỉ tính từ khi cài bản này, cần kết nối mạng khi kết thúc; các lượt cũ không có dữ liệu để khôi phục. Chuyên đề chưa mở có số 0. Nếu chưa chạy SQL hoặc mất kết nối, hiển thị “Chưa tải được”, không giả số 0. Việc ghi thống kê không thay đổi tính điểm hoặc quyền đọc tài liệu.

# Cập nhật 2.9.4

- Tải mã nguồn lên GitHub và chờ Vercel triển khai. Không có SQL mới; cần đã cài bản 004 của 2.9.3.
- Đăng nhập chuyển thẳng đến /hoc-tap.
- Thi thử tự lấy tên tài khoản đã xác thực; gói 20/50 hiện không xếp hạng nên khách không nhập tên. Ôn tập không yêu cầu tên.
- Trước đăng nhập, công khai tên đợt đã phát hành/đã đóng và họ tên, thời gian hoàn thành. Không công khai tài liệu, tài khoản hay mật khẩu. Quy định này thay thế hướng dẫn cũ yêu cầu đăng nhập để xem thống kê.
- Tài liệu cuối có thông báo hoàn thành và cảm ơn.
- Kết quả gói nhỏ vẫn được xử lý để chấm và xem lại bài, không đưa lên bảng xếp hạng.

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

Bản 2.9.1: tạo và đặt lại mật khẩu đảng viên yêu cầu đúng 6 chữ số (giữ cả số 0 đầu). Tài khoản cũ vẫn dùng mật khẩu cũ cho đến khi admin đặt lại. Mật khẩu admin vẫn 10–128 ký tự. Không chạy lại SQL. Nếu Supabase từ chối vì chính sách mật khẩu, vào Authentication > Sign In / Providers > Email, đặt Minimum password length = 6 và Required characters = không bắt buộc chữ/ký tự đặc biệt. Không thay khóa hay mật khẩu database. Tham khảo https://supabase.com/docs/guides/auth/password-security .

Bản 2.9.2: nút đăng nhập 3D đỏ–vàng, viền chuyển động (tắt khi thiết bị chọn giảm chuyển động); nền minh họa cách điệu Việt Nam, Hoàng Sa–Trường Sa và họa tiết trống đồng. Danh sách thống kê thu gọn riêng trong từng đợt, chỉ hiện sau đăng nhập. Thông báo tài liệu sẽ được quản trị viên gỡ sau khi đóng đợt và có thể tra cứu tại chi bộ. Không tự xóa tệp theo thời gian; vẫn do admin thao tác gỡ. Không chạy lại SQL.

## Cập nhật 2.9.3 — quản lý tài liệu đang triển khai
Chạy supabase/004-learning-documents.sql MỘT LẦN trong SQL Editor trước khi cập nhật code. Không chạy lại 002/003. Script giữ các xác nhận, thêm bảng lịch sử hoàn thành và cập nhật chức năng.
Chỉ admin được gỡ tài liệu hoặc bổ sung PDF/văn bản vào đợt nháp và đợt đang mở. Đợt đã đóng không nhận thêm tài liệu. Tài liệu gỡ không còn bắt buộc, nhưng tên và xác nhận cũ còn được giữ. Nếu chỉ còn các tài liệu đã xác nhận, hệ thống ghi nhận hoàn thành; đợt trống không tự tạo hoàn thành mới.
Bổ sung tài liệu vào đợt đang mở chuyển kết quả hoàn thành hiện tại vào learning_completion_history (lịch sử lưu trong cơ sở dữ liệu), giữ nguyên xác nhận từng tài liệu, và yêu cầu hoàn thành tài liệu mới trước khi hiển thị lại trong danh sách hoàn thành hiện tại. Lịch sử này chưa có bảng tra cứu riêng trên giao diện.
Gỡ tệp: hệ thống đánh dấu ngừng sử dụng trước, rồi xóa khỏi Storage. Nếu xóa Storage bị lỗi, admin có thể bấm Xóa nội dung lại để thử dọn tệp; tài liệu lỗi không còn được giao cho người đọc.
Nút người đọc: Xác nhận hoàn thành chuyển sang tài liệu tiếp theo. Chỉ mở khi đã cuộn hết và tải PDF hoàn tất. Có nút Tải lại tài liệu và tiến độ tải từng trang; PDF lỗi/mật khẩu/không phù hợp vẫn cần admin gỡ và tải bản nhẹ hoặc dán nội dung thay thế. Không cam kết mọi PDF đều đọc được.
