import {NextRequest,NextResponse} from 'next/server';
import {memberSession} from '../../../lib/member-session';
import {politicsBanks} from '../../../lib/politics-server';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
async function db(path:string,method='GET',body?:unknown){
 const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình kết nối.');
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Chưa đọc được quyền Tra cứu. Cán bộ phụ trách cần kiểm tra cấu hình SQL 027.');return r.json();
}
async function profile(req:NextRequest){const s=await memberSession(req).catch(e=>{if(e.message==='SESSION')return null;throw e;});if(!s)return null;return (await db('learning_people?id=eq.'+encodeURIComponent(s.id)+'&active=eq.true&deleted_at=is.null&select=id,name,role'))[0]||null;}
export async function GET(req:NextRequest){try{
 const mode=req.nextUrl.searchParams.get('view'),me=await profile(req);
 if(!me)return json(mode?{error:'Vui lòng đăng nhập.'}:{me:null,allowed:false},mode?401:200);
 if(mode==='admin'){if(me.role!=='admin')return json({error:'Không có quyền cấp tài khoản.'},403);return json({people:await db('learning_people?active=eq.true&deleted_at=is.null&select=id,name,username&order=name'),permissions:await db('lookup_permissions?select=person_id')});}
 const allowed=!!(await db('lookup_permissions?person_id=eq.'+encodeURIComponent(me.id)+'&select=person_id'))[0];
 if(mode==='bank'){if(!allowed)return json({error:'Tài khoản chưa được cấp quyền Tra cứu.'},403);return json({questions:Object.entries(politicsBanks).flatMap(([audience,b])=>b.questions.map(q=>({id:q.id,number:q.number,audience,question:q.question,options:q.options,correct_answer:q.correct_answer}))),versions:Object.fromEntries(Object.entries(politicsBanks).map(([a,b])=>[a,b.version]))});}
 return json({me:{name:me.name,admin:me.role==='admin'},allowed});
 }catch(e){return json({error:(e as Error).message},503);}}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Yêu cầu không hợp lệ.'},403);
 try{const me=await profile(req);if(!me)return json({error:'Vui lòng đăng nhập.'},401);if(me.role!=='admin')return json({error:'Chỉ cán bộ phụ trách được cấp quyền.'},403);
 const raw=await req.text();if(raw.length>500)return json({error:'Dữ liệu quá lớn.'},413);const p=JSON.parse(raw);
 if(!/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(p.person||'')||typeof p.allowed!=='boolean')return json({error:'Dữ liệu không hợp lệ.'},400);
 const target=(await db('learning_people?id=eq.'+p.person+'&active=eq.true&deleted_at=is.null&select=id'))[0];if(!target)return json({error:'Tài khoản không hoạt động.'},400);
 if(p.allowed)await db('lookup_permissions','POST',{person_id:p.person,granted_by:me.id,updated_at:new Date().toISOString()});else await db('lookup_permissions?person_id=eq.'+p.person,'DELETE');
 return json({ok:true});
 }catch(e){return json({error:(e as Error).message},400);}
}
