import Link from 'next/link';
export const metadata={title:'Lịch CTĐ, CTCT Văn phòng'};
export default function Page(){return <main className="practiceShell"><Link href="/">← Trang chủ</Link><section className="practicePanel" style={{marginTop:20,borderTop:'4px solid #bc9744'}}><p className="eyebrow">CÔNG CỤ VĂN PHÒNG</p><h1>Lịch CTĐ, CTCT Văn phòng</h1><p>Chưa có lịch được cập nhật. Chức năng quản lý lịch đang được chuẩn bị.</p><Link href="/cong-cu/bao-ban-ngay">Báo ban ngày →</Link></section></main>;}
