 'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {vnStamp} from '../lib/office-calendar';
import s from './HomeCalendar.module.css';
type Row={id:string;content:string;due_at:string;status:'done'|'overdue'|'soon'|'active'};
const labels={done:'Đã hoàn thành',overdue:'Quá hạn',soon:'Sắp đến hạn',active:'Đang thực hiện'};
export default function HomeCalendar(){
 const [rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();let pending=false;
 const load=async()=>{if(pending)return;pending=true;try{const r=await fetch('/api/lich-trang-chu',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error();const d=await r.json();if(!controller.signal.aborted){setRows(d.rows);setError('');setLoaded(true);}}catch{if(!controller.signal.aborted){setError('Chưa tải được lịch công tác.');setLoaded(true);}}finally{pending=false;}};
 load();const timer=setInterval(()=>{if(!document.hidden)load();},60000);return()=>{controller.abort();clearInterval(timer);};},[retry]);
 return <section className={s.panel} aria-labelledby="home-calendar-title"><header><h2 id="home-calendar-title">Lịch CTĐ, CTCT Văn phòng</h2><Link href="/dang-nhap?next=%2Fcong-cu%2Flich-ctd-ctct">Xem toàn bộ →</Link></header>
 {error?<p role="status">{error} <button onClick={()=>setRetry(x=>x+1)}>Thử lại</button></p>:!loaded?<p role="status">Đang tải lịch…</p>:!rows.length?<p>Chưa có nhiệm vụ được cập nhật.</p>:<ol>{rows.map((r,i)=><li key={r.id} className={s[r.status]}><span className={s.number}>{String(i+1).padStart(2,'0')}</span><p>{r.content}</p><div className={s.meta}><time dateTime={r.due_at}>Hạn: {vnStamp(r.due_at)}</time><span>{labels[r.status]}</span></div></li>)}</ol>}
 </section>;
}
