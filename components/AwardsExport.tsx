'use client';
import {useState} from 'react';
import type {Campaign} from '../lib/commendations';
import {validateAwardRange} from '../lib/awards-export';
import s from './AwardsExport.module.css';
export default function AwardsExport({year,demoEvents}:{year:number;demoEvents?:Campaign[]}){
 const [from,setFrom]=useState(`${year||new Date().getFullYear()}-01-01`),[to,setTo]=useState(`${year||new Date().getFullYear()}-12-31`),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function download(){setBusy(true);setMessage('');try{
  validateAwardRange(from,to);let events=demoEvents;
  if(!events){const response=await fetch(`/api/thi-dua?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,{cache:'no-store',signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Không tải được dữ liệu.');events=data.events;}
  const {createAwardsWorkbook}=await import('../lib/awards-export');const {book,count}=await createAwardsWorkbook(events!,from,to,!!demoEvents);
  const bytes=await book.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const a=document.createElement('a');a.href=url;a.download=`${demoEvents?'DEMO-':''}thi-dua-khen-thuong_${from}_${to}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage(`Đã tạo file Excel gồm ${count} dòng${demoEvents?' dữ liệu minh họa':''}.`);
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <section className={s.box} aria-label="Xuất tổng hợp Excel"><div><strong>Tổng hợp thi đua, khen thưởng</strong><p>Chọn khoảng thời gian để tải danh sách Excel.</p></div><form onSubmit={e=>{e.preventDefault();void download();}}><label>Từ ngày<input required type="date" value={from} onChange={e=>setFrom(e.target.value)} disabled={busy}/></label><label>Đến ngày<input required type="date" value={to} onChange={e=>setTo(e.target.value)} disabled={busy}/></label><button disabled={busy} type="submit">{busy?'Đang tạo file…':'↓ Xuất Excel'}</button></form><small>Lọc theo mốc thời gian của đợt, gồm cả ngày bắt đầu và kết thúc. Chỉ xuất nội dung đã công bố; đợt chưa ghi ngày không nằm trong kết quả.{demoEvents?' Bản demo sử dụng dữ liệu minh họa.':''}</small>{message&&<p role="status" className={s.message}>{message}</p>}</section>;
}
