import Link from 'next/link';
import StartPrompt from './StartPrompt';
import s from './page.module.css';
export const metadata={title:'Báo cáo ngày · Hướng dẫn trợ lý ChatGPT | Văn phòng'};
const stages=[
 ['An ninh an toàn','Dán nội dung báo cáo Word. Không phát sinh vụ việc thì nhập “Không”.'],
 ['Số liệu 7 cảng','Gửi ảnh và tồn bãi theo cảng đang được hỏi: Cát Lái → TCIT → TCTT → TCHP → HICT → TC189 → TC128. TCHP điền theo mẫu trợ lý đưa ra.'],
 ['Kế hoạch và ghi chú','Dán lần lượt ảnh lịch công tác, ảnh ghi chú. Phần nào không có thì nhập “Không”.'],
 ['Lịch trực','Dán nguyên tin nhắn lịch trực. Trợ lý tự điền các vị trí trong mẫu.'],
 ['Nhận bản Word','Khi đủ dữ liệu, tải tệp .docx và kiểm tra ngày, số liệu, lịch, bảng biểu trước khi sử dụng.'],
];
export default function Page(){return <main className={s.page}>
 <div className={s.nav}><Link href="/">← Trang chủ</Link><Link href="/cong-cu/lich-ctd-ctct">Lịch CTĐ, CTCT Văn phòng →</Link></div>
 <header className={s.hero}><p className={s.eyebrow}>CÔNG CỤ VĂN PHÒNG</p><h1>Báo cáo ngày</h1><p>Lập báo ban cùng trợ lý ChatGPT</p><div className={s.intro}>Gửi dữ liệu theo từng câu hỏi. Trợ lý tổng hợp nội dung, tính số liệu và xuất Word theo mẫu đã cấu hình.</div><a className={s.cta} href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Mở ChatGPT ↗</a><span className={s.hint}>Chọn Work và trợ lý sau khi đăng nhập.</span></header>
 <section className={s.section} aria-labelledby="quick"><h2 id="quick">Bắt đầu trong 3 bước</h2><p className={s.muted}>Minh họa thao tác; vị trí các nút có thể khác trên tài khoản của bạn.</p>
 <div className={s.cards}>
 <article className={s.card}><div className={s.art} role="img" aria-label="Minh họa chọn Work rồi chọn Trợ lý Báo ban ngày Văn phòng"><div className={s.bar}><i/><i/><i/></div><div className={s.tabs}><span>Chat</span><b>Work ✓</b></div><div className={s.selection}><span className={s.at}>@</span><strong>Trợ lý Báo ban ngày<br/>Văn phòng</strong></div><div className={s.line}/></div><h3><span>01</span> Mở đúng trợ lý</h3><p>Đăng nhập ChatGPT, mở <strong>Work (Làm việc)</strong>. Gõ <strong>@</strong> và chọn <strong>Trợ lý Báo ban ngày Văn phòng</strong>.</p></article>
 <article className={s.card}><div className={s.art} role="img" aria-label="Minh họa trợ lý hỏi cảng Cát Lái và người dùng gửi ảnh cùng tồn thực tế"><div className={s.bubble}>Cảng Cát Lái · Gửi ảnh số liệu</div><div className={s.reply}><div className={s.miniTable}><b/><b/><b/><i/><i/><i/><i/><i/><i/></div><span>Tồn thực tế: 100.000 TEU</span></div><small>Số minh họa, không dùng cho báo cáo thật</small></div><h3><span>02</span> Gửi đúng phần được hỏi</h3><p>Dán văn bản hoặc ảnh theo từng khâu. Với cảng, có thể gửi <strong>ảnh kèm số tồn bãi thực tế</strong> trong cùng tin nhắn.</p></article>
 <article className={s.card}><div className={s.art} role="img" aria-label="Minh họa báo cáo Word có bảng số liệu và nút tải"><div className={s.paper}><strong>BÁO BAN NGÀY</strong><div className={s.line}/><div className={s.miniTable}><b/><b/><b/><i/><i/><i/><i/><i/><i/></div><div className={s.line}/><div className={s.signature}/></div><div className={s.download}>↓ Báo cáo ngày.docx</div></div><h3><span>03</span> Tải và kiểm tra Word</h3><p>Trợ lý tự tính và điền mẫu khi đủ dữ liệu. Tải tệp, <strong>kiểm tra nội dung và bố cục</strong> trước khi trình báo cáo.</p></article>
 </div></section>
 <div className={s.columns}><section className={s.panel}><h2>Câu bắt đầu</h2><p>Chọn trợ lý trước, sau đó dán câu này vào Work:</p><StartPrompt/><div className={s.note}><strong>Chưa thấy trợ lý trong danh sách @?</strong><p>Liên hệ quản trị viên để nhận liên kết cài đặt hoặc quyền truy cập. Nút “Mở ChatGPT” chỉ mở ChatGPT, không tự cài skill.</p></div></section>
 <section className={s.panel}><h2>Chuẩn bị trước khi bắt đầu</h2><ul><li>Nội dung an ninh an toàn.</li><li>Ảnh số liệu các cảng và tồn bãi thực tế; số liệu nhập tay của TCHP.</li><li>Ảnh lịch công tác, ảnh ghi chú và tin nhắn lịch trực.</li></ul><p className={s.muted}>Chọn dữ liệu đúng kỳ báo cáo. Không cần nhập lại mẫu, người ký hay các quy tắc tính đã cấu hình.</p></section></div>
 <section className={s.section}><h2>Trợ lý sẽ hỏi theo thứ tự nào?</h2><ol className={s.steps}>{stages.map(([title,description],i)=><li key={title}><span>{i+1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section>
 <section className={s.reminders}><h2>Nhớ 3 điều</h2><p><strong>Dùng Work ngay từ đầu</strong> để có khả năng xuất tệp Word.</p><p><strong>Không áp dụng ngày 01 hằng tháng.</strong> Ngày báo cáo và số văn bản được trợ lý tự xác định.</p><p><strong>Muốn sửa số liệu:</strong> nêu rõ cảng, tên chỉ số và giá trị đúng trong cùng cuộc trò chuyện; không cần nhập lại toàn bộ.</p></section>
 <p className={s.footer}>Hướng dẫn theo Trợ lý Báo ban ngày Văn phòng · phiên bản 1.2.0. Dữ liệu được nhập trong ChatGPT; trang hướng dẫn này không nhận hoặc lưu nội dung báo cáo.</p>
 </main>;}
