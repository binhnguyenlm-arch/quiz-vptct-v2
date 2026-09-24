'use client';
import {useState} from 'react';
type Round={id:string;title:string;year:number;state:string};
export default function LoginRounds(){
 const [rounds,setRounds]=useState<Round[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/hoc-tap?view=rounds',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error();setRounds(d.rounds);}catch{setError('Chưa tải được danh sách đợt.');}finally{setBusy(false);}}
 return <details className="learningYear" onToggle={e=>{if(e.currentTarget.open&&rounds===null&&!error)void load();}}><summary>Danh sách các đợt nghị quyết</summary>{busy&&<p>Đang tải danh sách…</p>}{error&&<p>{error} <button type="button" onClick={()=>void load()}>Thử lại</button></p>}{rounds?.map(r=><p key={r.id}><strong>{r.title}</strong><br/><small>Năm {r.year} · {r.state==='closed'?'Đã đóng':'Đang triển khai'}</small></p>)}{rounds?.length===0&&<p>Chưa có đợt đã phát hành.</p>}</details>;
}
