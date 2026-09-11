import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ thống ôn tập – kiểm tra kiến thức",
  description: "Văn phòng Tổng công ty Tân Cảng Sài Gòn - Binh đoàn 20",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
