'use client';
import Link from 'next/link';
import {useEffect,useId,useRef,useState} from 'react';
import styles from './ToolsMenu.module.css';
export default function ToolsMenu(){
 const [open,setOpen]=useState(false),id=useId();
 const box=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 return <div ref={box} className={styles.wrap} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
 <button ref={button} className={styles.trigger} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span aria-hidden="true">▦</span> Công cụ <span aria-hidden="true">{open?'▴':'▾'}</span></button>
 <div id={id} hidden={!open} className={styles.panel}>
 <Link href="/cong-cu/bao-ban-ngay" onClick={()=>setOpen(false)}>Báo ban ngày <span aria-hidden="true">→</span></Link>
 <Link href="/cong-cu/lich-ctd-ctct" onClick={()=>setOpen(false)}>Lịch CTĐ, CTCT Văn phòng <span aria-hidden="true">→</span></Link>
 </div></div>;
}
