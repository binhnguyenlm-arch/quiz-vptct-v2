'use client';
import {useState} from 'react';
export default function StartPrompt(){
 const [message,setMessage]=useState('');
 const prompt='Bắt đầu lập báo ban ngày Văn phòng';
 return <div><p style={{marginBottom:12}}><code>{prompt}</code></p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(prompt);setMessage('Đã sao chép. Dán vào Work sau khi chọn trợ lý.');}catch{setMessage('Hãy chọn và sao chép câu bên trên.');}}}>Sao chép câu bắt đầu</button><p role="status" style={{fontSize:13,marginTop:8}}>{message}</p></div>;
}
