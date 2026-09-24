import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomBytes} from 'node:crypto';
import {memberSession} from '../../../lib/member-session';
import {bookDb,publishedBook} from '../../../lib/question-books-server';
import {bookTopics,validateQuestions} from '../../../lib/question-books';
import {requireUploads} from '../../../lib/usage-controls';
import politics from '../../../lib/banks/politics-test.json';
export const dynamic='force-dynamic';
async function admin(req:NextRequest){const me=await memberSession(req);if(!me)return null;const rows=await bookDb('learning_people?id=eq.'+me.id+'&active=eq.true&deleted_at=is.null&role=eq.admin&select=id');return rows[0]?.id||null;}
export async function GET(req:NextRequest){try{
 const manage=req.nextUrl.searchParams.get('manage')==='1';if(manage&&!await admin(req))return NextResponse.json({error:'Chỉ quản trị viên được quản lý bộ đề.'},{status:403});
 const id=req.nextUrl.searchParams.get('id');if(id){const b=await publishedBook(id);return NextResponse.json({id:b.id,title:b.title,topic:b.topic,status:b.status,question_count:b.question_count,questions:b.questions,published_at:b.published_at,updated_at:b.updated_at},{headers:{'Cache-Control':'no-store'}});}
 const books=await bookDb('question_books?'+(manage?'':'status=eq.published&')+'select=id,topic,title,status,question_count,published_at,updated_at&order=published_at.desc.nullslast,created_at.desc');
 const builtin=await bookDb('builtin_book_metadata?id=eq.politics-current&select=id,title,updated_on');
 if(!manage)books.push({id:'politics-current',topic:'politics',title:builtin[0]?.title||politics.title,status:'published',question_count:politics.questions.length,published_at:builtin[0]?.updated_on||null,updated_at:builtin[0]?.updated_on||'',builtin:true});
 const counts=manage?{}:await bookDb('rpc/question_book_counts','POST',{});return NextResponse.json({books,counts,builtin:builtin[0]},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:503});}}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 try{if(Number(req.headers.get('content-length'))>3000000)throw Error('Bộ đề quá lớn.');const raw=await req.text();if(raw.length>3000000)throw Error('Bộ đề quá lớn.');const p=JSON.parse(raw);
 if(p.op==='practice'){
  const book=await publishedBook(p.bookId);if(!/^[a-f0-9-]{36}$/i.test(p.id)||!Array.isArray(p.questionIds)||p.questionIds.length<1||p.questionIds.length>book.questions.length||new Set(p.questionIds).size!==p.questionIds.length||p.questionIds.some((id:string)=>!book.questions.some(q=>q.id===id)))throw Error('Lượt học không hợp lệ.');
  let guest=req.cookies.get('vptct_study_guest')?.value;if(!guest||! /^[a-f0-9]{64}$/.test(guest))guest=randomBytes(32).toString('hex');const participant=createHash('sha256').update(guest).digest('hex');
  if(!(await bookDb('question_book_practice?id=eq.'+p.id+'&select=id')).length){const recent=await bookDb('question_book_practice?participant=eq.'+participant+'&completed_at=gt.'+encodeURIComponent(new Date(Date.now()-3600000).toISOString())+'&select=id&limit=60');if(recent.length>=60)throw Error('Đã ghi nhận nhiều lượt trong giờ. Vui lòng thử lại sau.');await bookDb('question_book_practice','POST',{id:p.id,book_id:book.id,participant});}
  const res=NextResponse.json({ok:true});res.cookies.set('vptct_study_guest',guest,{httpOnly:true,secure:req.nextUrl.protocol==='https:',sameSite:'strict',path:'/',maxAge:31536000});return res;
 }
 const actor=await admin(req);if(!actor)return NextResponse.json({error:'Chỉ quản trị viên được cập nhật bộ đề.'},{status:403});
 if(p.op==='builtinMetadata'){if(typeof p.title!=='string'||!p.title.trim()||p.title.length>180||typeof p.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||Number.isNaN(Date.parse(p.date))||p.date>new Date().toISOString().slice(0,10))throw Error('Nhập tên và ngày cập nhật thực tế hợp lệ.');await bookDb('builtin_book_metadata?id=eq.politics-current','PATCH',{title:p.title.trim(),updated_on:p.date});return NextResponse.json({ok:true});}
 if(p.op==='upload'){
  await requireUploads();if(!bookTopics.some(t=>t.key===p.topic)||typeof p.title!=='string'||!p.title.trim()||p.title.trim().length>180)throw Error('Chọn học phần và nhập tên bộ đề tối đa 180 ký tự.');const questions=validateQuestions(p.questions);const hash=createHash('sha256').update(JSON.stringify(questions)).digest('hex');
  if((await bookDb('question_books?topic=eq.'+p.topic+'&content_hash=eq.'+hash+'&select=id')).length)throw Error('Nội dung bộ đề này đã được tải lên học phần.');
  const rows=await bookDb('question_books','POST',{topic:p.topic,title:p.title.trim(),questions,content_hash:hash,created_by:actor});return NextResponse.json({ok:true,id:rows[0].id});
 }
 if(!/^[a-f0-9-]{36}$/i.test(p.id))throw Error('Bộ đề không hợp lệ.');
 if(p.op==='publish'||p.op==='withdraw'){const current=await bookDb('question_books?id=eq.'+p.id+'&select=id,status,published_at');if(!current[0])throw Error('Không tìm thấy bộ đề.');await bookDb('question_books?id=eq.'+p.id,'PATCH',{status:p.op==='publish'?'published':'draft',updated_at:new Date().toISOString(),...(p.op==='publish'&&!current[0].published_at?{published_at:new Date().toISOString()}: {})});return NextResponse.json({ok:true});}
 throw Error('Thao tác không hợp lệ.');
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}
}
