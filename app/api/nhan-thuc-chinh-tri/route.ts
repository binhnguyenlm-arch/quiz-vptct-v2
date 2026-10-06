import {NextRequest,NextResponse} from 'next/server';
import {memberSession} from '../../../lib/member-session';
import {bookDb} from '../../../lib/question-books-server';
import {politicsBanks,politicsCatalog} from '../../../lib/politics-server';
import {mixedQuestionIds,type PoliticsQuestion} from '../../../lib/politics-config';
import {sampleQuestions} from '../../../lib/practice';
export const dynamic='force-dynamic';
const json=(d:unknown,status=200)=>NextResponse.json(d,{status,headers:{'Cache-Control':'private, no-store'}});
async function profile(req:NextRequest){const s=await memberSession(req).catch(e=>{if(e.message==='SESSION')return null;throw e;});if(!s)return null;const rows=await bookDb('learning_people?id=eq.'+s.id+'&active=eq.true&deleted_at=is.null&select=id,name,role');return rows[0]||null;}
async function rpc(p:unknown){const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình máy chủ.');const r=await fetch(base+'/rest/v1/rpc/politics_exam',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p}),cache:'no-store',signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok){const messages:Record<string,string>={FORBIDDEN:'Tài khoản chưa được cấp quyền thi đối tượng này.',SESSION:'Vui lòng đăng nhập lại.',NOT_FOUND:'Không tìm thấy lượt thi.',RATE_LIMIT:'Bạn đã bắt đầu quá nhiều lượt. Hãy thử lại sau.',INVALID:'Dữ liệu trả lời không hợp lệ.'};throw Error(messages[d.message]||'Chưa lưu được lượt thi. Vui lòng thử lại; không bắt đầu lượt mới.');}return d;}
export async function GET(req:NextRequest){try{
 const mode=req.nextUrl.searchParams.get('mode'),audience=req.nextUrl.searchParams.get('audience')||'';
 if(mode==='practice'){const bank=politicsBanks[audience];if(!bank)return json({error:'Bộ câu hỏi chưa được bổ sung.'},404);return json(bank);}
 const me=await profile(req);const permission=me?(await bookDb('politics_permissions?person_id=eq.'+me.id+'&select=audience'))[0]?.audience:null;
 const active=me?(await bookDb('politics_attempts?person_id=eq.'+me.id+'&status=eq.active&select=id'))[0]?.id:null;
 if(mode==='admin'){if(me?.role!=='admin')return json({error:'Chỉ cán bộ phụ trách được cấp quyền.'},403);return json({people:await bookDb('learning_people?active=eq.true&deleted_at=is.null&select=id,name,username,role&order=name'),permissions:await bookDb('politics_permissions?select=person_id,audience')});}
 const pendingStudy=me?await bookDb('rpc/politics_learning_pending','POST',{actor:me.id}).catch(()=>null):null;
 return json({banks:politicsCatalog(),me,permission,active,pendingStudy});
 }catch(e){return json({error:(e as Error).message},503);}}
export async function POST(req:NextRequest){if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Yêu cầu không hợp lệ.'},403);try{
 const raw=await req.text();if(raw.length>3000)return json({error:'Yêu cầu quá lớn.'},413);const p=JSON.parse(raw),me=await profile(req);if(!me)return json({error:'Vui lòng đăng nhập để thi.'},401);
 if(p.op==='assign'){if(me.role!=='admin')return json({error:'Chỉ cán bộ phụ trách được cấp quyền.'},403);if(!/^[a-f0-9-]{36}$/i.test(p.person)||!['','command','party','public'].includes(p.audience))return json({error:'Chọn tài khoản và đối tượng hợp lệ.'},400);return json(await rpc({op:'assign',actor:me.id,person:p.person,audience:p.audience}));}
 if(p.op==='start'){
  const bank=politicsBanks[p.audience];if(!bank||!['100','all','mixed'].includes(p.package)||p.package==='mixed'&&p.audience!=='command')return json({error:'Bộ câu hỏi hoặc gói thi chưa sẵn sàng.'},400);
  let questions;
  if(p.package==='mixed'){
   const latest=(await bookDb('politics_attempts?person_id=eq.'+me.id+'&audience=eq.command&bank_version=eq.'+bank.version+'&status=eq.done&order=finished_at.desc,id.desc&limit=1&select=questions,answers'))[0];
   const previous:PoliticsQuestion[]=latest?.questions||[],answers:Record<string,string>=latest?.answers||{};
   const wrong=previous.filter(q=>answers[q.id]!==q.correct_answer).map(q=>q.id);
   const seen=new Set(previous.map(q=>q.id));
   const ids=mixedQuestionIds(bank.questions.map(q=>q.id),wrong,100,bank.questions.filter(q=>!seen.has(q.id)).map(q=>q.id));
   const byId=new Map(bank.questions.map(q=>[q.id,q]));questions=ids.map(id=>byId.get(id)!);
  }else questions=sampleQuestions(bank.questions,p.package==='all'?bank.questions.length:Math.min(100,bank.questions.length));
  return json(await rpc({op:'start',actor:me.id,audience:p.audience,version:bank.version,full:p.package==='all'||bank.questions.length<=100,questions}));
 }

 if(!['resume','answer','discard'].includes(p.op)||! /^[a-f0-9-]{36}$/i.test(p.id)||p.op==='answer'&&(!Number.isInteger(p.cursor)||p.cursor<0||typeof p.answer!=='string'||p.answer.length>3))return json({error:'Yêu cầu không hợp lệ.'},400);
 return json(await rpc({op:p.op,actor:me.id,id:p.id,cursor:p.cursor,answer:p.answer}));
 }catch(e){return json({error:(e as Error).message},400);}}
