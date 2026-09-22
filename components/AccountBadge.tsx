'use client';
import {useState} from 'react';
export default function AccountBadge({name,position,photo}:{name:string;position?:string;photo?:string}){
 const [failed,setFailed]=useState('');
 const initials=name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase();
 return <aside className="accountBadge" aria-label="Tài khoản đã đăng nhập"><div className="accountAvatar"><div>{photo&&failed!==photo?<img src={photo} alt={`Ảnh đại diện của ${name}`} width="64" height="64" onError={()=>setFailed(photo)}/>:<span aria-label="Ảnh đại diện mặc định">{initials||'VP'}</span>}</div><span className="accountOnline" title="Đã đăng nhập"/></div><div className="accountIdentity"><small>VĂN PHÒNG · THÀNH VIÊN</small><strong>{name}</strong><span>{position||'Chưa bổ sung chức danh'}</span></div><div className="accountZalo"><button type="button" disabled aria-describedby="zaloPending"><b>Z</b> Kết nối Zalo</button><small id="zaloPending">Chưa kết nối · Sắp có</small></div></aside>;
}
