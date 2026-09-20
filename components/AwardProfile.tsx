'use client';
import {useState} from 'react';
import {compress,request} from './Commendations';
export default function AwardProfile({id}:{id:string}){
 const [open,setOpen]=useState(false),[position,setPosition]=useState(''),[photo,setPhoto]=useState(''),[base,setBase]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function load(){setBusy(true);try{const r=await fetch('/api/thi-dua?manage=1');const d=await r.json();if(!r.ok)throw Error(d.error);const p=d.people.find((x:{id:string})=>x.id===id);if(!p)throw Error('Không tìm thấy tài khoản.');setPosition(p.position);setPhoto(p.photo);setBase(d.imageBase);setOpen(true);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <div className="awardProfile"><button disabled={busy} onClick={()=>open?setOpen(false):void load()}>{open?'Đóng hồ sơ':'Ảnh / chức danh'}</button>{open&&<form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await request({op:'profile',id,position,photo});setMessage('Đã lưu hồ sơ. Các đợt đã lưu giữ thông tin tại thời điểm khen thưởng.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}><label>Chức danh<input maxLength={150} value={position} onChange={e=>setPosition(e.target.value)}/></label>{photo&&<img src={base+photo} width="72" height="90" style={{objectFit:'cover'}} alt="Ảnh hồ sơ"/>}<label>Ảnh chân dung<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setBusy(true);try{const form=new FormData();form.set('file',await compress(f),'photo.webp');const d=await request(form);setPhoto(d.path);}catch(err){setMessage((err as Error).message);}finally{setBusy(false);}}}/></label><button type="button" disabled={busy} onClick={()=>setPhoto('')}>Gỡ ảnh</button> <button disabled={busy}>Lưu hồ sơ</button></form>}{message&&<p role="status">{message}</p>}</div>;
}


