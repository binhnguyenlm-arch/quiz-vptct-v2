'use client';
import {useEffect,useState} from 'react';
import Practice from './Practice';
import MockExam from './MockExam';
import type {QuestionBook} from '../lib/question-books';
export default function BookStudy({id,exam}:{id:string;exam:boolean}){
 const [book,setBook]=useState<QuestionBook|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(exam)return;fetch('/api/bo-de?id='+encodeURIComponent(id),{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setBook(d);}).catch(e=>setError(e.message));},[id,exam]);
 if(exam)return <MockExam bookId={id}/>;
 if(error)return <main className="practiceShell"><p role="alert">{error}</p><a href="/">Về trang chủ</a></main>;
 if(!book?.questions)return <main className="practiceShell"><p>Đang tải bộ câu hỏi…</p></main>;
 return <Practice questions={book.questions} bookId={id} bookTitle={book.title}/>;
}
