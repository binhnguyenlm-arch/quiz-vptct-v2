# VPTCT 2.3 — Giao diện cảng số, cảng xanh

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

Chưa có Admin để thay ngân hàng/gói từ giao diện. Hiện cấu hình bằng lib/mock.ts; khi thay bộ TEST cần phiên bản ngân hàng mới để tách thành tích. Hai chuyên đề chưa có câu hỏi vẫn khóa.

Bản 2.3: biểu tượng vàng kim, quân hiệu đã sửa theo mẫu, mô tả quân sự mới, khẩu hiệu và nền minh họa AI cảng số/cảng xanh. Chưa có trang quản trị. Không thay đổi ngân hàng câu hỏi, phiên bản xếp hạng hoặc dữ liệu thành tích.
