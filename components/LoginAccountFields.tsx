'use client';
import {useEffect,useState} from 'react';
type Account={id:string;name:string;username:string;role:string};
export default function LoginAccountFields(){
 const [accounts,setAccounts]=useState<Account[]>([]),[selected,setSelected]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 async function load(){setLoading(true);setError('');try{const r=await fetch('/api/hoc-tap?view=accounts',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error('Chưa tải được danh sách tên. Vui lòng thử lại.');setAccounts(d.accounts);}catch{setError('Chưa tải được danh sách tên. Vui lòng thử lại.');}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const account=accounts.find(a=>a.id===selected);
 return <><label>Họ và tên<select aria-label="Họ và tên" required value={selected} disabled={loading} onChange={e=>{setSelected(e.target.value);const password=e.target.closest('form')?.querySelector<HTMLInputElement>('input[name="password"]');if(password)password.value='';}}><option value="">{loading?'Đang tải danh sách tên…':'— Chọn họ và tên —'}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.username}{a.role==='admin'?' (Quản trị viên)':''}</option>)}</select></label>{error&&<p role="alert">{error} <button type="button" onClick={()=>void load()}>Tải lại danh sách tên</button></p>}<label>Tài khoản<input name="username" value={account?.username||''} readOnly required autoComplete="username" placeholder="Tự hiển thị sau khi chọn tên"/></label><label>Mật khẩu<input name="password" type="password" required autoComplete="current-password" maxLength={128}/></label></>;
}
