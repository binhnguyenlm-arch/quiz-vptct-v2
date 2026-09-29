import Link from 'next/link';
export const metadata={title:'Báo ban ngày | Văn phòng'};
export default function Page(){return <main className="practiceShell"><Link href="/">← Trang chủ</Link><section className="practicePanel" style={{marginTop:20,borderTop:'4px solid #bc9744'}}><p className="eyebrow">CÔNG CỤ VĂN PHÒNG</p><h1>Báo ban ngày</h1><p>Chưa có nội dung. Chức năng cập nhật báo ban đang được chuẩn bị.</p><Link href="/cong-cu/lich-ctd-ctct">Lịch CTĐ, CTCT Văn phòng →</Link></section></main>;}
