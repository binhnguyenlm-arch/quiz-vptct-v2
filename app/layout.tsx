import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Không gian số Văn phòng | Tổng công ty Tân Cảng Sài Gòn - Binh đoàn 20",
  description: "Không gian số phục vụ học tập, phối hợp công tác và hỗ trợ một số nghiệp vụ tại Văn phòng Tổng công ty Tân Cảng Sài Gòn - Binh đoàn 20.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
