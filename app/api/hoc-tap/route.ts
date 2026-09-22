import {NextRequest,NextResponse} from 'next/server';
import {PDFDocument} from '../../../lib/vendor/pdf-lib';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const bucket='learning-private';
const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f-]{36}$/.test(s);
async function sb(path:string,method='GET',body?:unknown,token?:string){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('Chưa cấu hình kết nối học tập.');
 const r=await fetch(base.replace(/\/$/,'')+path,{method,headers:{apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(r.status===404&&method==='DELETE'&&path.startsWith('/auth/v1/admin/users/'))return null;
 if(!r.ok)throw Error('Không thực hiện được. Kiểm tra quyền truy cập, dữ liệu và cấu hình phân hệ.');
 return r.status===204?null:r.json();
}
async function pdfPages(path:string){
 const base=process.env.SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
 const response=await fetch(`${base.replace(/\/$/,'')}/storage/v1/object/authenticated/${bucket}/${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Không tải được PDF để đếm số trang.');
 if(Number(response.headers.get('content-length'))>20971520)throw Error('PDF vượt quá 20 MB.');
 const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>20971520)throw Error('PDF vượt quá 20 MB.');
 try{const pdf=await PDFDocument.load(bytes,{updateMetadata:false});const pages=pdf.getPageCount();if(pages<1||pages>100000)throw Error('PAGES');return pages;}catch{throw Error('Không đếm được số trang PDF. Hãy dùng PDF không đặt mật khẩu và kiểm tra lại tệp.');}
}
async function identity(req:NextRequest){const token=req.cookies.get('learning_session')?.value;if(!token)return null;try{const u=await sb('/auth/v1/user','GET',undefined,token);const a=await sb(`/rest/v1/learning_people?id=eq.${u.id}&active=eq.true&select=id,name,username,role,audience`);const person=a[0];if(!person)return null;try{const profiles=await sb(`/rest/v1/learning_people?id=eq.${u.id}&select=position,photo`);person.position=profiles[0]?.position||'';const photo=profiles[0]?.photo;person.avatar_url=typeof photo==='string'&&/^images\/[0-9a-f-]+\.webp$/i.test(photo)?process.env.SUPABASE_URL!.replace(/\/$/,'')+'/storage/v1/object/public/office-awards/'+photo:'';}catch{person.position='';person.avatar_url='';}return person;}catch{return null;}}
async function table(name:string,query=''){const rows=[];for(let offset=0;offset<100000;offset+=1000){const page=await sb(`/rest/v1/learning_${name}?${query}&limit=1000&offset=${offset}`);rows.push(...page);if(page.length<1000)return rows;}throw Error('Danh sách quá lớn. Vui lòng liên hệ quản trị viên.');}
async function completionGroups(rows:any[]){
 const ids=[...new Set(rows.map(c=>c.person_id))];if(!ids.length)return rows;
 const people=await table('people',`id=in.(${ids.join(',')})&select=id,audience,created_at`);
 return rows.map(c=>({...c,audience:people.find(u=>u.id===c.person_id)?.audience||'party',created_at:people.find(u=>u.id===c.person_id)?.created_at||''})).sort((a,b)=>a.audience.localeCompare(b.audience)||a.created_at.localeCompare(b.created_at)||a.person_id.localeCompare(b.person_id));
}
async function roundTotals(rounds:any[]){
 if(!rounds.length)return;
 const cohort=await table('assigned',`round_id=in.(${rounds.map(r=>r.id).join(',')})&select=round_id,person_id`);
 const ids=[...new Set(cohort.map(a=>a.person_id))];
 const people=ids.length?await table('people',`id=in.(${ids.join(',')})&select=id,audience`):[];
 const groups=new Map(people.map(p=>[p.id,p.audience]));
 for(const r of rounds){const members=cohort.filter(a=>a.round_id===r.id);r.assigned_count=members.length;r.party_count=members.filter(a=>groups.get(a.person_id)==='party').length;r.public_count=members.filter(a=>groups.get(a.person_id)==='public').length;}
}
export async function GET(req:NextRequest){
 try{const me=await identity(req);const directory=await sb('/rest/v1/rpc/learning_directory','POST',{});if(!me){const rounds=await table('rounds','deleted_at=is.null&state=in.(open,closed)&select=id,title,year,state,audience&order=year.desc,created_at.desc');const ids=rounds.map(r=>r.id);const completed=ids.length?await table('completed',`round_id=in.(${ids.join(',')})&select=round_id,person_id,name_snapshot,completed_at&order=completed_at.asc`):[];await roundTotals(rounds);return NextResponse.json({me:null,rounds,completed:await completionGroups(completed),directory},{headers:{'Cache-Control':'no-store'}});}
 const admin=me.role==='admin';const assigned=await table('assigned',admin?'':`person_id=eq.${me.id}`);
 const ids=assigned.map((a:{round_id:string})=>a.round_id);const rounds=admin?await table('rounds','order=year.desc,created_at.desc'):ids.length?await table('rounds',`deleted_at=is.null&id=in.(${ids.join(',')})&order=year.desc,created_at.desc`):[];
 const roundIds=rounds.map((r:{id:string})=>r.id);const scope=roundIds.length?`round_id=in.(${roundIds.join(',')})`:'round_id=is.null';
 const cohort=await table('assigned',scope);
 await roundTotals(rounds);
 const docs=await table('docs',`${scope}&select=id,round_id,title,kind,position,removed,path&order=position.asc`);
 for(const d of docs){d.pending_file=Boolean(d.removed&&d.path);delete d.path;}
 const receipts=await table('receipts',`person_id=eq.${me.id}`);
 const completed=await table('completed',scope);
 const people=admin?await table('people','or=(deleted_at.is.null,auth_deleted.eq.false)&select=id,name,username,role,active,deleted_at,audience,created_at&order=audience.asc,created_at.asc,id.asc'):[];
 // Only assigned participants (or administrators) can see completion names.
 return NextResponse.json({me,rounds,docs,receipts,completed:await completionGroups(completed),people,directory,assigned:admin?assigned:[]},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Chưa kết nối được phân hệ học tập. Vui lòng thử lại.'},{status:503});}
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 try{
 const raw=await req.text();if(raw.length>250000)return NextResponse.json({error:'Nội dung quá dài.'},{status:413});const p=JSON.parse(raw);
 if(p.op==='logout'){const res=NextResponse.json({ok:true});res.cookies.delete('learning_session');return res;}
 if(p.op==='login'){
  if(typeof p.username!=='string'||! /^[a-z0-9._-]{3,50}$/.test(p.username)||typeof p.password!=='string'||p.password.length>128)throw Error('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
  const auth=await sb('/auth/v1/token?grant_type=password','POST',{email:`${p.username}@vptct.internal`,password:p.password});
  const people=await table('people',`id=eq.${auth.user.id}&active=eq.true`);if(!people[0])throw Error('Tài khoản chưa được cấp quyền.');
  const res=NextResponse.json({ok:true});res.cookies.set('learning_session',auth.access_token,{httpOnly:true,secure:req.nextUrl.protocol==='https:',sameSite:'strict',path:'/',maxAge:Math.min(auth.expires_in||3600,3600)});return res;
 }
 const me=await identity(req);if(!me)return NextResponse.json({error:'Vui lòng đăng nhập lại.'},{status:401});
 if(p.op==='read'||p.op==='confirm'){
  if(!uuid(p.id))throw Error('Tài liệu không hợp lệ.');
  const docs=await table('docs',`id=eq.${p.id}`);const d=docs[0];if(!d)throw Error('Không tìm thấy tài liệu.');
  const a=await table('assigned',`round_id=eq.${d.round_id}&person_id=eq.${me.id}`);
  const r=(await table('rounds',`id=eq.${d.round_id}`))[0];
  if(!r||r.deleted_at||me.role!=='admin'&&(!a.length||r.state==='draft'))return NextResponse.json({error:'Không có quyền đọc tài liệu.'},{status:403});
  if(p.op==='confirm')return NextResponse.json(await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p:{op:'confirm',id:p.id}}));
  if(d.removed)throw Error('Tài liệu đã được gỡ sau khi kết thúc đợt học tập.');
  if(d.kind==='text')return NextResponse.json({body:d.body,kind:'text'});
  const link=await sb(`/storage/v1/object/sign/${bucket}/${d.path}`,'POST',{expiresIn:3600});return NextResponse.json({kind:'pdf',url:process.env.SUPABASE_URL+'/storage/v1'+link.signedURL});
 }
 if(me.role!=='admin')return NextResponse.json({error:'Chỉ quản trị viên được thực hiện.'},{status:403});
 if(p.op==='deleteRound'){
  if(!uuid(p.id))throw Error('Đợt không hợp lệ.');
  await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p:{op:'deleteRound',id:p.id}});
  const docs=await table('docs',`round_id=eq.${p.id}&path=not.is.null&select=path`);
  try{for(let i=0;i<docs.length;i+=100)await sb('/storage/v1/object/'+bucket,'DELETE',{prefixes:docs.slice(i,i+100).map(d=>d.path)});}catch{throw Error('Đợt đã ẩn khỏi người học. Chưa xóa hết tệp; bấm Xóa đợt lần nữa để hoàn tất.');}
  await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p:{op:'purgeRound',id:p.id}});
  return NextResponse.json({ok:true,message:'Đã xóa đợt và tài liệu đính kèm.'});
 }
 if(p.op==='assignPerson'){
  if(!uuid(p.id)||!uuid(p.person_id))throw Error('Chọn người học cần bổ sung.');
  return NextResponse.json(await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p}));
 }
 if(p.op==='setAudience'){
  if(!uuid(p.id)||!['party','public'].includes(p.audience))throw Error('Phân loại không hợp lệ.');
  return NextResponse.json(await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p}));
 }
 if(p.op==='syncGreenPages'){
  const docs=await sb('/rest/v1/learning_docs?kind=eq.pdf&a4_pages=is.null&path=not.is.null&removed=eq.false&select=id,path&limit=3');let count=0;
  for(const d of docs){const pages=await pdfPages(d.path);await sb(`/rest/v1/learning_docs?id=eq.${d.id}`,'PATCH',{a4_pages:pages});count++;}
  return NextResponse.json({ok:true,message:count?`Đã cập nhật số trang cho ${count} PDF. Bấm lại để kiểm tra các tệp còn lại.`:'Đã kiểm tra xong: không còn PDF có thể bổ sung số trang.'});
 }
 if(p.op==='deleteUser'){
  if(!uuid(p.id)||p.id===me.id)throw Error('Không thể xóa tài khoản này.');
  const target=(await table('people',`id=eq.${p.id}`))[0];if(!target||target.role!=='member')throw Error('Chỉ được xóa tài khoản đảng viên, không xóa tài khoản admin.');
  // Invalidate access and release username first; Auth deletion can be retried safely.
  await sb('/rest/v1/rpc/learning_delete_account','POST',{actor:me.id,target:p.id});
  try{await sb('/auth/v1/admin/users/'+p.id,'DELETE');await sb(`/rest/v1/learning_people?id=eq.${p.id}`,'PATCH',{auth_deleted:true});}catch{throw Error('Đã khóa tài khoản nhưng chưa xóa được thông tin đăng nhập. Bấm Xóa tài khoản lần nữa để thử lại trước khi tạo lại.');}
  return NextResponse.json({ok:true});
 }
 if(p.op==='createUser'){
  if(!['party','public'].includes(p.audience))throw Error('Chọn phân loại người học.');
  if(typeof p.username!=='string'||! /^[a-z0-9._-]{3,50}$/.test(p.username)||typeof p.name!=='string'||p.name.trim().length<2||p.name.length>100||typeof p.password!=='string'||! /^[0-9]{6}$/.test(p.password))throw Error('Tên đăng nhập 3–50 ký tự không dấu; mật khẩu đảng viên đúng 6 chữ số; họ tên 2–100 ký tự.');
  const u=await sb('/auth/v1/admin/users','POST',{email:`${p.username}@vptct.internal`,password:p.password,email_confirm:true});
  try{await sb('/rest/v1/learning_people','POST',{id:u.id,username:p.username,name:p.name.trim().replace(/\s+/g,' '),role:'member',audience:p.audience});}catch(e){await sb('/auth/v1/admin/users/'+u.id,'DELETE');throw e;}return NextResponse.json({ok:true,status:'created'});
 }
 if(p.op==='resetPassword'){
  if(!uuid(p.id))throw Error('Tài khoản không hợp lệ.');const target=(await table('people',`id=eq.${p.id}`))[0];if(!target)throw Error('Không tìm thấy tài khoản.');if(typeof p.password!=='string'||(target.role==='member'?! /^[0-9]{6}$/.test(p.password):p.password.length<10||p.password.length>128))throw Error(target.role==='member'?'Mật khẩu đảng viên cần đúng 6 chữ số.':'Mật khẩu admin cần 10–128 ký tự.');await sb('/auth/v1/admin/users/'+p.id,'PUT',{password:p.password});return NextResponse.json({ok:true});
 }
 if(p.op==='active'){
  if(!uuid(p.id))throw Error('Tài khoản không hợp lệ.');if((await table('people',`id=eq.${p.id}`))[0]?.deleted_at)throw Error('Tài khoản đã xóa không thể mở khóa. Hãy tạo tài khoản mới.');
  if(!uuid(p.id)||p.id===me.id||typeof p.active!=='boolean')throw Error('Không thể thay đổi tài khoản này.');await sb(`/rest/v1/learning_people?id=eq.${p.id}`,'PATCH',{active:p.active});return NextResponse.json({ok:true});
 }
 if(p.op==='upload'){
  if(!uuid(p.round_id)||!Number.isInteger(p.size)||p.size<1||p.size>20971520)throw Error('PDF tối đa 20 MB.');const r=(await table('rounds',`id=eq.${p.round_id}`))[0];if(r?.deleted_at||!['draft','open'].includes(r?.state))throw Error('Đợt đã đóng, không thể thêm tài liệu.');
  const path=`${p.round_id}/${randomUUID()}.pdf`;const data=await sb(`/storage/v1/object/upload/sign/${bucket}/${path}`,'POST',{});return NextResponse.json({path,url:process.env.SUPABASE_URL+'/storage/v1'+data.url});
 }
 if(p.op==='discardUpload'){
  if(typeof p.path!=='string'||! /^[a-f0-9-]+\/[a-f0-9-]+\.pdf$/.test(p.path))throw Error('Tệp không hợp lệ.');
  if((await table('docs',`path=eq.${p.path}`)).length)throw Error('Tệp đã gắn vào tài liệu.');
  await sb('/storage/v1/object/'+bucket,'DELETE',{prefixes:[p.path]});return NextResponse.json({ok:true});
 }
 if(p.op==='erase'){
  if(!uuid(p.id))throw Error('Tài liệu không hợp lệ.');const d=(await table('docs',`id=eq.${p.id}`))[0];if(!d)throw Error('Không tìm thấy tài liệu.');const r=(await table('rounds',`id=eq.${d.round_id}`))[0];if(!r)throw Error('Không tìm thấy đợt.');
  if(d.kind==='pdf'&&d.a4_pages==null&&d.path){try{const pages=await pdfPages(d.path);await sb(`/rest/v1/learning_docs?id=eq.${d.id}`,'PATCH',{a4_pages:pages});}catch{/* Keep unavailable page totals unknown; allow removal of damaged files. */}}
  await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p:{op:'erase',id:p.id}});
  if(d.path){await sb('/storage/v1/object/'+bucket,'DELETE',{prefixes:[d.path]});await sb(`/rest/v1/learning_docs?id=eq.${p.id}`,'PATCH',{path:null});}
  return NextResponse.json({ok:true});
 }
 if(p.op==='createRound'&&!['party','public','both'].includes(p.audience))throw Error('Chọn đối tượng học tập.');
 if(p.op==='createRound'&&(typeof p.title!=='string'||!p.title.trim()||p.title.length>200||typeof p.description!=='string'||p.description.length>2000||!Number.isInteger(p.year)||p.year<2020||p.year>2200))throw Error('Kiểm tra tên đợt, mô tả và năm học tập.');
 if(p.op==='addDoc'){
  if(!uuid(p.round_id)||typeof p.title!=='string'||!p.title.trim()||p.title.length>200||!['text','pdf'].includes(p.kind))throw Error('Thông tin tài liệu không hợp lệ.');
  if(p.kind==='text'&&(typeof p.body!=='string'||!p.body.trim()||p.body.length>100000))throw Error('Nội dung soạn thảo cần 1–100.000 ký tự.');
  if(p.kind==='pdf'){
   if(typeof p.path!=='string'||!p.path.startsWith(p.round_id+'/')||! /^[a-f0-9-]+\/[a-f0-9-]+\.pdf$/.test(p.path))throw Error('Tệp không hợp lệ.');
   const info=await sb(`/storage/v1/object/info/${bucket}/${p.path}`);if(!info)throw Error('Tệp chưa tải xong.');p.a4_pages=await pdfPages(p.path);
  }
 }
 if(p.op==='editText'&&(!uuid(p.id)||typeof p.title!=='string'||!p.title.trim()||p.title.length>200||typeof p.body!=='string'||!p.body.trim()||p.body.length>100000))throw Error('Kiểm tra tên và nội dung tài liệu.');
 if(!['createRound','addDoc','editText','publish','close','erase'].includes(p.op))throw Error('Thao tác không hợp lệ.');
 return NextResponse.json(await sb('/rest/v1/rpc/learning_action','POST',{actor:me.id,p}));
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Chưa thực hiện được. Vui lòng thử lại.'},{status:400});}
}
