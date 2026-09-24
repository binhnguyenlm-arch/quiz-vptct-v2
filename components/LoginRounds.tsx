'use client';
import {useEffect,useState} from 'react';
type Round={id:string;title:string;year:number;state:string};
export default function LoginRounds(){
 const [rounds,setRounds]=useState<Round[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/hoc-tap?view=rounds',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error();setRounds(d.rounds);}catch{setError('Chưa tải được danh sách đợt.');}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 return <section aria-label="Danh sách các đợt nghị quyết"><h2>Các đợt học tập, quán triệt</h2><p style={{fontSize:13}}>Mở sẵn 5 đợt gần nhất. Bấm “Danh sách người đã nghiên cứu” để xem xác nhận hoàn thành.</p>{busy&&<p role="status">Đang tải danh sách đợt…</p>}{error&&<p role="status">{error} Bạn vẫn có thể đăng nhập. <button type="button" onClick={()=>void load()}>Thử lại</button></p>}{rounds?.map((r,index)=><details key={r.id} className="learningYear" open={index<5}><summary style={{cursor:'pointer'}}>{r.title}</summary><p><small>Năm {r.year} · {r.state==='closed'?'Đã đóng':'Đang triển khai'}</small></p><CompletedList roundId={r.id}/></details>)}{rounds?.length===0&&<p>Chưa có đợt đã phát hành.</p>}</section>;
}
type Completion={name_snapshot:string;completed_at:string};
function CompletedList({roundId}:{roundId:string}){
 const [rows,setRows]=useState<Completion[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/hoc-tap?view=round-completed&id='+encodeURIComponent(roundId),{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error();setRows(d.completed);}catch{setError('Chưa tải được danh sách người đã nghiên cứu.');}finally{setBusy(false);}}
 return <details className="completionDetails" onToggle={e=>{if(e.currentTarget.open&&rows===null&&!error)void load();}}><summary>Danh sách người đã nghiên cứu</summary>{busy&&<p role="status">Đang tải xác nhận…</p>}{error&&<p>{error} <button type="button" onClick={()=>void load()}>Thử lại</button></p>}{rows&&<>{rows.length===0?<p>Chưa có xác nhận hoàn thành.</p>:<div className="completionTableWrap"><table className="completionTable"><thead><tr><th scope="col">STT</th><th scope="col">Họ và tên</th><th scope="col">Hoàn thành lúc</th></tr></thead><tbody>{rows.map((row,index)=><tr key={index}><td>{index+1}</td><th scope="row">{row.name_snapshot}</th><td>{new Date(row.completed_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</td></tr>)}</tbody></table></div>}</>}</details>;
}
