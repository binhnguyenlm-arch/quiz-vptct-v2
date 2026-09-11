# VPTCT — UI V2

Gói giao diện Next.js hoàn chỉnh, nâng cấp từ repo binhnguyenlm-arch/quiz-vptct-v2 (commit gốc e865f713f1c17b9f078ea5784a70f73b57778a0f).

## Cập nhật website hiện tại

1. Giải nén ZIP. Bên trong phải nhìn thấy trực tiếp app, components, lib, public, package.json và package-lock.json.
2. Trong repo GitHub quiz-vptct-v2 hiện có, chọn Add file → Upload files. Kéo toàn bộ nội dung đã giải nén vào và Commit changes một lần. Không upload file ZIP hoặc thư mục bọc ngoài.
3. Vercel tự triển khai từ commit mới. Chờ Ready rồi mở website, tải lại trang và kiểm tra banner cùng các nút.

Giữ nguyên project, domain, liên kết repo và Root Directory hiện tại. Không cần biến môi trường hoặc Supabase. Không phải chỉnh từng file. Gói này dành riêng cho repo UI quiz-vptct-v2, không dùng để ghi đè repo MVP cũ có Admin/API/Supabase.

## Có trong phiên bản này

- Logo SNP gốc, header và dòng Văn phòng đúng nhận diện.
- Banner cờ Việt Nam lớn, nền cảng chân thực; chữ HTML riêng, responsive.
- Ba chuyên đề, cửa sổ xem trước Ôn tập/Thi thử và chọn số câu.
- Bảng xếp hạng có bộ lọc thật, xếp điểm giảm dần và thời gian tăng dần.
- Thống kê, giới thiệu, hướng dẫn, hỗ trợ bàn phím và giảm chuyển động.

Đây là UI V2: các số liệu và tên trong bảng là minh họa, không phải dữ liệu cá nhân/kết quả thực tế. Chưa có ngân hàng câu hỏi, logic thi, tính giờ, chấm điểm, Admin, đăng nhập hoặc kết nối database. Các nút Ôn tập/Thi thử mở cửa sổ cấu hình xem trước và thông báo trạng thái rõ ràng.

## Chạy và kiểm tra

Node.js 22 trở lên; dùng npm ci, npm run build, npm start. Phát triển bằng npm run dev.

Đã kiểm tra production build và TypeScript; kiểm tra trình duyệt ở 1440, 768, 390, 360 px: không tràn ngang toàn trang, mở Ôn tập và Thi thử, chọn số câu, Escape/Đã hiểu để đóng, lọc chuyên đề. Bảng trên điện thoại có cuộn ngang riêng. Không có lỗi JavaScript trong các lượt kiểm tra. Kiểm tra local không thay thế trạng thái deploy Ready trên tài khoản Vercel của người dùng.

## Cấu trúc để phát triển tiếp

app/page.tsx: trang chủ và tương tác UI.
app/globals.css: nhận diện, bố cục và responsive.
app/layout.tsx: ngôn ngữ và metadata.
components/Icon.tsx: biểu tượng SVG.
lib/content.ts: dữ liệu minh họa, dễ thay bằng dữ liệu thật.
public/logo-snp.png: logo gốc đã có trong repo.
public/hero-v2.webp: nền banner tối ưu.

Không có khóa hoặc cấu hình Supabase trong gói. package-lock.json khóa phiên bản để cài đặt đồng bộ. Next.js 16.3.4, React 19.3.0. Có thể nối database và xây các trang học/thi ở mốc tiếp theo.

## Nguồn hình ảnh

Logo: tài sản người dùng cung cấp, giữ nguyên từ project.
Banner: tạo bằng công cụ imagegen tích hợp; là hình tổng hợp phong cách ảnh chụp, không phải ảnh tư liệu một cảng cụ thể. Prompt: nền hero siêu rộng, cờ Việt Nam đỏ với một sao vàng năm cánh mềm ở trái, cảng container chân thực ở phải, khoảng trời xanh nhạt thoáng ở giữa, không chữ/logo/watermark. Ảnh được chuyển WebP chất lượng 88 để giảm tải.

Thông tin phiên bản Next.js tham khảo: https://nextjs.org/blog và registry npm tại thời điểm đóng gói.
