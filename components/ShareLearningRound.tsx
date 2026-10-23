'use client';
import {useState} from 'react';
export function roundStudyPath(id:string){return '/hoc-tap?round='+encodeURIComponent(id);}
export default function ShareLearningRound({id}:{id:string}){
 const [message,setMessage]=useState(''),[fallback,setFallback]=useState('');
 async function copy(){const url=new URL(roundStudyPath(id),window.location.origin).href;try{await navigator.clipboard.writeText(url);setFallback('');setMessage('Đã sao chép link đợt học. Người nhận đăng nhập sẽ vào đúng đợt này.');}catch{setFallback(url);setMessage('Hãy sao chép đường dẫn bên dưới để chia sẻ.');}}
 return <div style={{margin:'12px 0'}}><button type="button" onClick={()=>void copy()} style={{fontSize:13,fontWeight:400}}>Sao chép link đợt học ↗</button>{message&&<p role="status" style={{fontSize:13,marginTop:8}}>{message}</p>}{fallback&&<input aria-label="Link chia sẻ đợt học" readOnly value={fallback} onFocus={e=>e.currentTarget.select()} style={{width:'100%'}}/>}</div>;
}
