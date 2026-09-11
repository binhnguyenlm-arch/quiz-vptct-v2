type Item={id:string;section:string;correct_answer?:string};
export default function ResultInsights({questions,answers}:{questions:Item[];answers:Record<string,string>}){
 const groups=new Map<string,{total:number;correct:number}>();
 for(const q of questions){const g=groups.get(q.section)||{total:0,correct:0};g.total++;if(q.correct_answer&&answers[q.id]===q.correct_answer)g.correct++;groups.set(q.section,g);}
 const rows=[...groups].sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
 return <section className="resultInsights" aria-label="Nội dung cần củng cố"><h2>Học tiếp từ kết quả của bạn</h2><p>Đối chiếu từng nhóm nội dung trong lượt này. Câu bỏ trống được tính là chưa đúng.</p><div>{rows.map(([name,g])=><article key={name}><div><h3>{name}</h3><strong>{g.correct}/{g.total} đúng</strong></div><progress value={g.correct} max={g.total} aria-label={`${name}: ${g.correct} trên ${g.total} câu đúng`}/><small>{g.correct===g.total?'Đã trả lời đúng toàn bộ trong lượt này':`Cần xem lại ${g.total-g.correct} câu để củng cố kiến thức`}</small></article>)}</div></section>;
}
