'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
const Portal=dynamic(()=>import('./LearningPortal'));
const Ranking=dynamic(()=>import('./Leaderboard'));
const Green=dynamic(()=>import('./GreenImpact'));
export default function DeferredHome({kind}:{kind:'portal'|'ranking'|'green'}){const ref=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);useEffect(()=>{if(!('IntersectionObserver' in window)){setReady(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){setReady(true);observer.disconnect();}},{rootMargin:'200px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);return <div ref={ref} id={kind==='ranking'?'ranking':undefined} style={{minHeight:ready?undefined:kind==='portal'?300:180}}>{ready?(kind==='portal'?<Portal mode="home"/>:kind==='ranking'?<Ranking/>:<Green/>):<p className="deferredHint">{kind==='portal'?'Học tập, quán triệt nghị quyết':kind==='ranking'?'Bảng xếp hạng Thi thử':'Số hóa · Xanh hóa'}</p>}</div>;}
