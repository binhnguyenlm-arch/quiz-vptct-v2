'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {QuestionBook} from '../lib/question-books';
import styles from './QuestionBooks.module.css';
let pending:Promise<{books:QuestionBook[];counts:Record<string,number>}>|undefined;
let fetchedAt=0;
export function invalidateBooks(){pending=undefined;fetchedAt=0;}
export function loadBooks(){if(Date.now()-fetchedAt>30000)pending=undefined;if(!pending){fetchedAt=Date.now();pending=fetch('/api/bo-de',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d;}).catch(e=>{pending=undefined;throw e;});}return pending;}
export default function QuestionBooks({topic}:{topic:string}){
 const [books,setBooks]=useState<QuestionBook[]>([]),[count,setCount]=useState<number|null>(null),[failed,setFailed]=useState(false),[all,setAll]=useState(false);
 async function load(){try{const d=await loadBooks();setBooks(d.books.filter(b=>b.topic===topic));setCount(d.counts[topic]||0);setFailed(false);}catch{setFailed(true);}}
 useEffect(()=>{void load();},[topic]);
 return <div id={'books-'+topic} className={styles.books}>{topic!=='politics'&&<span className="studyCount">Số lần học tập: <strong>{count===null?'—':count}</strong></span>}{failed?<p>Chưa tải được danh sách bộ đề. <button onClick={()=>void load()}>Thử lại</button></p>:<>{(all?books:books.slice(0,2)).map((b,i)=><article key={b.id}><Link href={b.builtin?'/on-tap':'/bo-de/'+b.id}><strong>{b.title}</strong></Link><div className={i===0?styles.gold:styles.date}>{i===0&&b.published_at&&<b>NEW </b>}{b.published_at?new Date(b.published_at).toLocaleDateString('vi-VN'):'Chưa ghi nhận ngày cập nhật'} · {b.question_count} câu</div><div className={styles.actions}><Link href={b.builtin?'/on-tap':'/bo-de/'+b.id}>Ôn tập</Link><Link href={b.builtin?'/thi-thu':'/bo-de/'+b.id+'?mode=exam'}>Thi thử →</Link></div></article>)}{!books.length&&<p>{topic==='politics'?'Bộ TEST nhận thức chính trị hiện hành · Chưa có ngày công bố được ghi nhận.':'Chưa có bộ đề được công bố.'}</p>}{books.length>2&&<button onClick={()=>setAll(!all)}>{all?'Thu gọn':'Xem tất cả bộ đề'}</button>}</>}</div>;
}
