'use client';
import {useState} from 'react';
import {compress} from './Commendations';
export default function AccountBadge({name,position,photo}:{name:string;position?:string;photo?:string}){
 const [failed,setFailed]=useState(''),[localPhoto,setLocalPhoto]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const visiblePhoto=localPhoto||photo;
 const initials=name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase();
 async function change(file:File){setBusy(true);setMessage('');try{if(file.size>=10*1024*1024)throw Error('Vui lòng chọn ảnh nhỏ hơn 10 MB.');const data=new FormData();data.set('file',await compress(file),'avatar.webp');const response=await fetch('/api/anh-dai-dien',{method:'POST',body:data});const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa lưu được ảnh.');setLocalPhoto(result.photo);setFailed('');setMessage('Đã cập nhật ảnh đại diện.');}catch(e){setMessage(e instanceof Error?e.message:'Không xử lý được ảnh.');}finally{setBusy(false);}}
 return <aside className="accountBadge" aria-label="Tài khoản đã đăng nhập"><div className="accountAvatar"><div>{visiblePhoto&&failed!==visiblePhoto?<img src={visiblePhoto} alt={`Ảnh đại diện của ${name}`} width="64" height="64" onError={()=>setFailed(visiblePhoto)}/>:<span aria-label="Ảnh đại diện mặc định">{initials||'VP'}</span>}</div><span className="accountOnline" title="Đã đăng nhập"/></div><div className="accountIdentity"><small>VĂN PHÒNG · THÀNH VIÊN</small><strong>{name}</strong><span>{position||'Chưa bổ sung chức danh'}</span><label className="avatarUpload">{busy?'Đang lưu ảnh…':'Đổi ảnh'}<input aria-label="Đổi ảnh đại diện" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void change(file);}}/></label><small>JPG, PNG, WebP · nhỏ hơn 10 MB</small>{message&&<small role="status">{message}</small>}</div><div className="accountZalo"><button type="button" disabled aria-describedby="zaloPending"><b>Z</b> Kết nối Zalo</button><small id="zaloPending">Chưa kết nối · Sắp có</small></div></aside>;
}

