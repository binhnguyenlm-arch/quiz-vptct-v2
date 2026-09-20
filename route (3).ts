import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomBytes} from 'node:crypto';
import bank from '../../../lib/banks/politics-test.json';
import {availablePackages,largestPackage,bankVersion,normalizeName,nameError,shuffledOptions} from '../../../lib/mock';
import {sampleQuestions} from '../../../lib/practice';
import {memberSession} from '../../../lib/member-session';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const configured=()=>Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const boardFor=(id:string)=>`${bankVersion}:${id}`;
async function rpc(p:Record<string,unknown>){
 const base=process.env.SUPABASE_URL!;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
 const r=await fetch(`${base.replace(/\/$/,'')}/rest/v1/rpc/vptct_mock`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message==='RATE_LIMIT'?'RATE_LIMIT':e.message==='NOT_FOUND'?'NOT_FOUND':'DATABASE');}return r.json();
}
export async function GET(req:NextRequest){
 const packages=availablePackages(bank.questions.length);const max=largestPackage(bank.questions.length);const top=packages.find(p=>p.count===max);
 if(!configured())return NextResponse.json({ready:false,packages,max,rows:[],message:'Thi thử đang chờ kết nối lưu kết quả. Bạn có thể Ôn tập trong lúc chờ.'});
 try{const member=await memberSession(req).catch(()=>null);const data=top?await rpc({op:'board',board:boardFor(top.id)}):{rows:[]};return NextResponse.json({ready:true,packages,max,...data,member});}catch{return NextResponse.json({ready:false,packages,max,rows:[],message:'Chưa kết nối được bảng kết quả. Vui lòng thử lại sau.'},{status:503});}
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(!configured())return NextResponse.json({error:'Thi thử chưa kết nối lưu kết quả. Vui lòng thử lại sau.'},{status:503});
 if(Number(req.headers.get('content-length'))>100000)return NextResponse.json({error:'Dữ liệu quá lớn.'},{status:413});
 try{
 const raw=await req.text();if(raw.length>100000)return NextResponse.json({error:'Dữ liệu quá lớn.'},{status:413});const body=JSON.parse(raw);
 let guest=req.cookies.get('vptct_guest')?.value; if(!guest||! /^[a-f0-9]{64}$/.test(guest))guest=randomBytes(32).toString('hex');
 let payload:Record<string,unknown>;let token='';
 if(body.op==='start'){
  const pkg=availablePackages(bank.questions.length).find(p=>p.id===body.packageId);const member=await memberSession(req);const eligible=Boolean(pkg&&pkg.count===largestPackage(bank.questions.length));const name=member?.name||(eligible?normalizeName(typeof body.name==='string'?body.name:''):'Người thi thử');const error=eligible&&!member?nameError(name):'';
  if(!pkg||error)return NextResponse.json({error:error||'Gói câu hỏi không còn mở.'},{status:400});
  token=randomBytes(32).toString('hex');
  payload={op:'start',participant:hash(guest),token_hash:hash(token),name,package_id:pkg.id,board:boardFor(pkg.id),eligible:pkg.count===largestPackage(bank.questions.length),seconds:pkg.minutes*60,questions:sampleQuestions(bank.questions,pkg.count).map(q=>shuffledOptions(q)).map(q=>({id:q.id,question:q.question,options:q.options,correct_answer:q.correct_answer,explanation:q.explanation,source:q.source,section:q.section}))};
 }else{
  if(!['save','submit','resume','discard'].includes(body.op)||typeof body.id!=='string'||! /^[0-9a-f-]{36}$/.test(body.id)||typeof body.token!=='string'||! /^[0-9a-f]{64}$/.test(body.token))return NextResponse.json({error:'Không tìm thấy lượt thi thử hợp lệ.'},{status:400});
  const answers=body.answers??{};if(typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length>1000||!Object.values(answers).every(v=>['A','B','C','D'].includes(v as string)))return NextResponse.json({error:'Đáp án không hợp lệ.'},{status:400});
  const revision=body.revision??0;if(!Number.isInteger(revision)||revision<0||revision>1000000)return NextResponse.json({error:'Lượt lưu không hợp lệ.'},{status:400});
  payload={op:body.op,id:body.id,participant:hash(guest),token_hash:hash(body.token),answers,revision};
 }
 const data=await rpc(payload);const response=NextResponse.json({...data,...(token?{token}:{})});response.cookies.set('vptct_guest',guest,{httpOnly:true,secure:req.nextUrl.protocol==='https:',sameSite:'lax',maxAge:31536000,path:'/'});return response;
 }catch(e){const message=e instanceof Error?e.message:'';return NextResponse.json({error:message==='SESSION'?'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lấy đúng họ tên.':message==='RATE_LIMIT'?'Bạn đã bắt đầu nhiều lượt trong thời gian ngắn. Vui lòng thử lại sau.':message==='NOT_FOUND'?'Không tìm thấy lượt thi trên trình duyệt này.':'Chưa lưu được kết quả. Giữ trang này và bấm thử lại; không cần làm lại bài.'},{status:message==='RATE_LIMIT'?429:message==='NOT_FOUND'?404:503});}
}
