# VPTCT 2.7 — Bản giao diện hoàn chỉnh

Nếu cập nhật từ 2.2 đang chạy: upload toàn bộ nội dung gói vào thư mục gốc repo, commit main và chờ Vercel Ready. Giữ nguyên hai biến Supabase hiện tại; không cần chạy lại SQL. Chỉ đọc KET-NOI-SUPABASE.md khi thiết lập một hệ thống mới. Bản này bổ sung Thi thử có tính giờ, chuẩn hóa tên, trộn câu và đáp án, lưu tiến độ và bảng xếp hạng TEST chung bằng Supabase mới. Không tổ chức kỳ thi thật. Không bình luận hoặc chấm sao.

Ôn tập hoạt động như bản 2.1, không cần database và không xếp hạng. Thi thử chỉ mở khi Supabase được kết nối thành công. Thiếu cấu hình thì trang thông báo rõ, không sinh người/điểm/thứ hạng giả.

Cấu trúc chính:
- app/page.tsx và components/Leaderboard.tsx: trang chủ, bảng xếp hạng thật hoặc trạng thái chờ kết nối.
- components/Practice.tsx: Ôn tập và hướng dẫn từng bước.
- components/MockExam.tsx: Thi thử, đồng hồ, lưu, khôi phục, nộp, xem lại và lời động viên.
- app/api/thi-thu/route.ts: máy chủ chuẩn hóa, chọn câu, chỉ gọi Supabase bằng biến bí mật.
- supabase/001-mock.sql: tạo bảng, hàm chấm và xếp hạng; không chứa khóa hoặc dữ liệu mẫu.
- lib/mock.ts: gói, thời gian, phiên bản ngân hàng, chuẩn hóa tên, trộn đáp án và lời chúc.
- lib/banks/politics-test.json: 100 câu test có nguồn, chưa thẩm định dùng chính thức.

Node.js 22.18+ hoặc 24. Cài bằng npm ci; npm run build; npm start. Kiểm tra logic bằng node --experimental-strip-types --test tests/*.test.mjs.

Giữ nguyên nhận diện V2, logo SNP gốc, banner imagegen phong cách ảnh chụp và font đã duyệt. Banner tại public/hero-v2.webp; prompt gốc: cờ Việt Nam lớn mềm bên trái, cảng container chân thực bên phải, trời xanh nhạt thoáng ở giữa, không chữ/logo/watermark. Không phải ảnh tư liệu một cảng cụ thể.

Chưa có Admin để thay ngân hàng/gói từ giao diện. Hiện cấu hình bằng lib/mock.ts; khi thay bộ TEST cần phiên bản ngân hàng mới để tách thành tích. Năm chuyên đề chưa có câu hỏi vẫn khóa.

Giao diện trang chủ: biểu tượng vàng kim, quân hiệu đã sửa theo mẫu, mô tả quân sự mới, khẩu hiệu và nền minh họa AI cảng số/cảng xanh. Chưa có trang quản trị. Không thay đổi ngân hàng câu hỏi, phiên bản xếp hạng hoặc dữ liệu thành tích.

Bản 2.5 bổ sung giao diện làm bài và kết quả, nút đến câu chưa trả lời, thống kê nhóm nội dung sau khi hoàn tất. Bao gồm 6 chuyên đề, top 3 và dòng tác giả. Không cần đổi cấu hình Supabase hoặc chạy lại SQL khi cập nhật từ 2.2–2.4.

Bản 2.6: bố cục làm bài hai cột trên máy tính, focus không tự cuộn khi đổi câu; nền ảnh Chi ủy đã duyệt với bệ đá và chú thích nhiệm kỳ 2025 - 2030. Trang chủ có ảnh Bác Hồ nguyên gốc cùng trích dẫn ngắn. Nguồn kiểm chứng trích dẫn: https://btllang.bqp.vn/chu-tich-ho-chi-minh/nghien-cuu-hoc-tap-tu-tuong-ho-chi-minh/7723-a-hoc-de-lam-viec-lam-nguoi-lam-can-boa.html (không hiển thị dòng nguồn trên giao diện theo yêu cầu).

Cập nhật: giải nén và upload nội dung vào gốc repo quiz-vptct-v2, commit main; kiểm tra dự án Vercel ontap-vptct. Giữ hai biến Supabase hiện tại, không chạy lại SQL. Chưa có Admin/Zalo/lịch làm việc. Kiểm tra build và giao diện bằng bộ dữ liệu thử; kết nối Supabase thật cần kiểm tra sau triển khai.

Bản 2.7: banner cảng số/cảng xanh mới (public/hero-digital-green.png), cẩu ghi SNP, hai huân chương thu nhỏ với nền hòa trong suốt trên banner. Bỏ logo SNP giữa banner; tiêu đề hai dòng không dấu nối, xanh biển đậm với ánh sáng dưới chữ; VĂN PHÒNG đỏ. Điều chỉnh khung hẹp để giữ rõ lá cờ. Giữ nguyên chức năng, ngân hàng câu hỏi và Supabase.
