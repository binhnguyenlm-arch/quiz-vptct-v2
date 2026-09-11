const topics = [
  {
    key: "politics",
    title: "NHẬN THỨC CHÍNH TRỊ",
    desc: "Chủ trương, đường lối của Đảng; chính sách, pháp luật của Nhà nước; nhiệm vụ của Quân đội và Binh đoàn.",
    count: 300,
    exams: 5,
    icon: "☭",
    tone: "red",
  },
  {
    key: "law",
    title: "PHÁP LUẬT",
    desc: "Hệ thống pháp luật, quy định trong Quân đội, doanh nghiệp, công tác pháp chế và các văn bản liên quan.",
    count: 250,
    exams: 3,
    icon: "⚖",
    tone: "blue",
  },
  {
    key: "military",
    title: "QUÂN SỰ – QUỐC PHÒNG",
    desc: "Kiến thức quân sự, quốc phòng, bảo vệ an ninh, an toàn, công tác sẵn sàng chiến đấu và nhiệm vụ của đơn vị.",
    count: 200,
    exams: 4,
    icon: "★",
    tone: "green",
  },
];

const ranking = [
  ["1", "Nguyễn Văn An", "Nhận thức chính trị", "98/100", "32:15", "03/09/2026 09:12"],
  ["2", "Trần Thị Minh", "Pháp luật", "97/100", "34:20", "02/09/2026 14:05"],
  ["3", "Lê Hoàng Nam", "Quân sự – Quốc phòng", "95/100", "36:18", "01/09/2026 10:21"],
  ["4", "Phạm Thúy Hằng", "Nhận thức chính trị", "94/100", "38:42", "30/08/2026 16:30"],
  ["5", "Đỗ Quốc Tùng", "Pháp luật", "93/100", "40:11", "29/08/2026 08:17"],
];

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <div className="brandWrap">
          <img src="/logo-snp.png" alt="Logo Saigon Newport" className="brandLogo" />
          <div>
            <div className="brandTitle">TỔNG CÔNG TY TÂN CẢNG SÀI GÒN - BINH ĐOÀN 20</div>
            <div className="brandSub">VĂN PHÒNG</div>
          </div>
        </div>
        <nav className="nav">
          <a className="active" href="#">⌂ Trang chủ</a>
          <a href="#about">▣ Giới thiệu</a>
          <a href="#guide">▤ Hướng dẫn</a>
          <a className="adminBtn" href="#admin">▣ Quản trị</a>
        </nav>
      </header>

      <section className="hero">
        <div className="flagWave"><span className="star">★</span><span className="flagText">Vững vàng<br/>vươn xa</span></div>
        <div className="heroPort" aria-hidden="true">
          <span className="crane c1"></span><span className="crane c2"></span><span className="crane c3"></span>
          <span className="ship"></span>
        </div>
        <div className="heroCenter">
          <img src="/logo-snp.png" alt="SNP" className="heroLogo" />
          <h1>HỆ THỐNG ÔN TẬP – KIỂM TRA KIẾN THỨC</h1>
          <h2>VĂN PHÒNG</h2>
          <p>Nâng cao nhận thức – Củng cố kiến thức – Hoàn thành tốt nhiệm vụ</p>
        </div>
        <div className="values">ĐOÀN KẾT<br/>KỶ CƯƠNG<br/>CHỦ ĐỘNG<br/>SÁNG TẠO<br/>HIỆU QUẢ</div>
      </section>

      <section className="content shell">
        <div className="sectionHead">
          <h3>CHỌN NỘI DUNG HỌC TẬP</h3>
          <p>Lựa chọn chuyên đề phù hợp để ôn tập hoặc tham gia thi thử</p>
        </div>

        <div className="topicGrid">
          {topics.map((topic) => (
            <article className={`topicCard ${topic.tone}`} key={topic.key}>
              <div className="topicTop">
                <div className="topicIcon">{topic.icon}</div>
                <div>
                  <h4>{topic.title}</h4>
                  <p>{topic.desc}</p>
                </div>
              </div>
              <div className="topicMeta">
                <span>▤ <b>{topic.count}</b> câu hỏi</span>
                <span>▥ <b>{topic.exams}</b> kỳ thi đã tổ chức</span>
              </div>
              <div className="topicActions">
                <button className="outlineBtn">▣ ÔN TẬP</button>
                <button className="solidBtn">✎ THI THỬ</button>
              </div>
            </article>
          ))}
        </div>

        <section className="rankingCard">
          <div className="rankingTitle"><span>🏆</span><b>BẢNG XẾP HẠNG GẦN ĐÂY</b><a href="#">Xem tất cả ›</a></div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Hạng</th><th>Họ và tên</th><th>Chuyên đề</th><th>Điểm</th><th>Thời gian</th><th>Thời gian thi</th></tr></thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r[0]}>
                    <td><span className={`rank rank${i+1}`}>{r[0]}</span></td>
                    <td>{r[1]}</td><td>{r[2]}</td><td><b>{r[3]}</b></td><td>{r[4]}</td><td>{r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stats">
          <div><b>750+</b><span>Câu hỏi trong ngân hàng</span></div>
          <div><b>12</b><span>Kỳ thi đã tổ chức</span></div>
          <div><b>1.256</b><span>Lượt tham gia</span></div>
          <div><b>98%</b><span>Hài lòng người dùng</span></div>
        </section>
      </section>

      <footer className="footer">
        <div><b>TỔNG CÔNG TY TÂN CẢNG SÀI GÒN - BINH ĐOÀN 20</b><br/><strong>VĂN PHÒNG</strong><br/><span>Thành phố Hồ Chí Minh, Việt Nam</span></div>
        <em>“Chủ động – Sáng tạo – Hiệu quả – Phát triển bền vững”</em>
      </footer>
    </main>
  );
}
