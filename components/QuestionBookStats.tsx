'use client';
import {useEffect,useState} from 'react';
import {loadBooks} from './QuestionBooks';
export default function QuestionBookStats(){const [stats,setStats]=useState<{topics:number;books:number;questions:number}|null>(null);useEffect(()=>{void loadBooks().then(d=>setStats({topics:new Set(d.books.map(b=>b.topic)).size,books:d.books.length,questions:d.books.reduce((s,b)=>s+b.question_count,0)})).catch(()=>{});},[]);return <section className="stats" aria-label="Tình trạng bộ câu hỏi"><div><b>{stats?.topics??'—'}</b><span>Học phần có bộ câu hỏi</span></div><div><b>{stats?.books??'—'}</b><span>Bộ đề đang công bố</span></div><div><b>{stats?.questions??'—'}</b><span>Câu hỏi trong các bộ</span></div><div><b>4</b><span>Phương án mỗi câu</span></div></section>;}
