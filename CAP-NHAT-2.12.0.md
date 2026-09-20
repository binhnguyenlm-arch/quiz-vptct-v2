# Cập nhật 2.12.0 — Thi đua - Khen thưởng

## Thứ tự cập nhật
1. Supabase → SQL Editor → New query: dán toàn bộ supabase/009-commendations.sql và Run.
2. Tạo query mới: dán toàn bộ supabase/010-award-profiles.sql và Run.
3. Giải nén vptct-hoc-tap-2.12.0.zip. Mở thư mục có app, components, lib, public, scripts, supabase, tests.
4. GitHub → quiz-vptct-v2 → Add file → Upload files. Kéo TOÀN BỘ các thư mục và tệp ở cấp này vào vùng tải lên. Không lấy riêng các tệp bên trong thư mục, không tải ZIP lên kho, không kéo thư mục cha vptct-hoc-tap-2.12.0.
5. Trước Commit, kiểm tra thấy app/api/thi-dua/route.ts, components/Commendations.tsx, components/AwardProfile.tsx, lib/commendations.ts. Nếu chỉ thấy route.ts hoặc Commendations.tsx không có thư mục, hủy và tải lại đúng cấu trúc.
6. Commit trực tiếp main với nội dung “Cập nhật 2.12.0 Thi đua - Khen thưởng”. Chờ Vercel Ready cho commit này rồi tải lại website.

Không cần xóa tệp nào từ bộ 2.11.4 đã được dọn đúng. Không xóa kho, dự án Vercel, bảng học tập hoặc dữ liệu cũ. Hai SQL mới không chứa lệnh xóa dữ liệu học tập. Không cần đổi biến môi trường.

## Sử dụng
- Trang công bố: /thi-dua-khen-thuong. Đường dẫn /lich-cong-tac cũ tự chuyển sang trang này.
- Admin đăng nhập bằng tài khoản hiện có, mở /quan-tri-hoc-tap → tài khoản → Ảnh / chức danh → Lưu hồ sơ.
- Mở /quan-tri-thi-dua để tạo hoặc chỉnh sửa đợt. Chỉ tên đợt bắt buộc. Có thể nhập ngày cũ, khoảng thời gian bằng chữ, hoặc để trống ngày (nhóm Chưa ghi thời gian).
- Thêm nhiều tập thể, ảnh bằng khen; thêm nhiều cá nhân bằng cách chọn tài khoản. Ảnh, tên và chức danh được chụp lại từ hồ sơ khi lưu đợt; không tự thay đổi lịch sử khi hồ sơ đổi.
- Tích Công bố rồi Lưu để hiển thị công khai. Bỏ tích để chuyển về nháp. Trang người xem cập nhật khi tải lại, lấy nét cửa sổ hoặc sau khoảng 60 giây khi đang mở.
- Các đợt mặc định thu gọn, phân theo năm/tháng. Không đặt hạn mức số đợt trong ứng dụng; dung lượng thực tế phụ thuộc gói lưu trữ.
- Ảnh JPG/PNG/WebP đầu vào tối đa 15 MB, tự thu nhỏ thành WebP tối đa 1 MB/ảnh. Ảnh thuộc phân hệ công bố dùng kho công khai; chỉ tải hình được phép phổ biến. Gỡ ảnh/xóa đợt hiện gỡ liên kết hiển thị, chưa tự xóa tệp khỏi Storage để tránh mất ảnh được dùng lại trong lịch sử.
- /demo-thi-dua là trang minh họa riêng, có nhãn demo; không phải kết quả khen thưởng thật. Chưa nhập dữ liệu demo vào cơ sở dữ liệu.

## Kiểm tra sau triển khai
Mở trang chủ và nút mới; tạo một đợt nháp; cập nhật hồ sơ; chọn cá nhân và tập thể; công bố; kiểm tra bằng cửa sổ chưa đăng nhập. Kiểm tra ngày cũ và đợt để trống ngày. Tài khoản thường không có quyền cập nhật.
