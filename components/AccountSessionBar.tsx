 'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {loginHref} from '../lib/login-navigation';
import s from './AccountSessionBar.module.css';
type Me={name:string;role:string};
export default function AccountSessionBar(){
 const path=usePathname(),[me,setMe]=useState<Me|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[href,setHref]=useState('/dang-nhap');
 useEffect(()=>{let disposed=false;const controller=new AbortController();setLoaded(false);setError('');setHref(loginHref(window.location.pathname+window.location.search));
 async function check(){try{const r=await fetch('/api/hoc-tap?view=login',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error();const d=await r.json();if(!disposed){setMe(d.me);setLoaded(true);setError('');}}catch{if(!disposed){setLoaded(true);setError('Chưa kiểm tra được tài khoản.');}}}
 check();const focus=()=>{if(!document.hidden)check();};const storage=(e:StorageEvent)=>{if(e.key==='office-session-change')window.location.reload();};window.addEventListener('focus',focus);window.addEventListener('storage',storage);return()=>{disposed=true;controller.abort();window.removeEventListener('focus',focus);window.removeEventListener('storage',storage);};},[path]);
 async function logout(){setBusy(true);setError('');try{const r=await fetch('/api/hoc-tap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'logout'})});if(!r.ok)throw Error();try{localStorage.setItem('office-session-change',String(Date.now()));}catch{}window.location.replace(loginHref(window.location.pathname+window.location.search));}catch{setBusy(false);setError('Chưa thoát được tài khoản. Vui lòng thử lại.');}}
 if(path==='/dang-nhap'&&!me&&!error)return null;
 return <aside className={s.bar} aria-label="Tài khoản dùng chung"><div><span>{!loaded?'Đang kiểm tra tài khoản…':me?<>Đã đăng nhập: <strong>{me.role==='admin'?'Cán bộ phụ trách':me.name}</strong></>:'Tài khoản Văn phòng'}</span>{error&&<small role="alert">{error}</small>}</div>{me?<button disabled={busy} onClick={logout}>{busy?'Đang thoát…':'Thoát tài khoản'}</button>:loaded&&<Link href={href}>Đăng nhập đảng viên →</Link>}</aside>;
}
