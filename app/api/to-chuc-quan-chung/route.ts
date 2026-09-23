import {requireUploads} from '../../../lib/usage-controls';
import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function config(){const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình kết nối.');return {base,key};}
async function sb(path:string,method='GET',body?:unknown,token?:string){const {base,key}=config();const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok){const e=await r.json().catch(()=>({}));const messages:Record<string,string>={FORBIDDEN:'Bạn không có quyền thực hiện thao tác này.',CONFLICT:'Hoạt động đã được người khác sửa. Tải lại trước khi chỉnh sửa.',NOT_FOUND:'Hoạt động không còn tồn tại.',MEMBER:'Thành viên không còn hoạt động. Hãy tải lại danh sách.',DUPLICATE:'Thành viên bị chọn trùng.',INVALID:'Kiểm tra ngày, tiêu đề và nội dung.'};throw Error(messages[e.message]||'Không kết nối được dữ liệu. Kiểm tra đã chạy SQL 012 và thử lại.');}return r.status===204?null:r.json();}
async function identity(req:NextRequest){const token=req.cookies.get('learning_session')?.value;if(!token)return null;try{const user=await sb('/auth/v1/user','GET',undefined,token);const people=await sb('/rest/v1/learning_people?id=eq.'+encodeURIComponent(user.id)+'&active=eq.true&deleted_at=is.null&select=id,name,role');return people[0]||null;}catch{return null;}}
const uuid=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(x);
export async function GET(req:NextRequest){try{
 const q=req.nextUrl.searchParams,me=await identity(req);
 if(q.get('people')==='1'){
  if(!me)return NextResponse.json({error:'Vui lòng đăng nhập để chọn thành viên.'},{status:401});
  const people=[];for(let offset=0;;offset+=1000){const page=await sb('/rest/v1/learning_people?active=eq.true&deleted_at=is.null&select=id,name,position&order=name,id&limit=1000&offset='+offset);people.push(...page);if(page.length<1000)break;}return NextResponse.json({people},{headers:{'Cache-Control':'no-store'}});
 }
 const org=q.get('org')||'';if(org&&!['union','women','youth'].includes(org))throw Error('Tổ chức không hợp lệ.');
 const number=(key:string,min:number,max:number,fallback:number)=>{const v=Number(q.get(key)||fallback);if(!Number.isInteger(v)||v<min||v>max)throw Error('Trang hoặc năm không hợp lệ.');return v;};
 const data=await sb('/rest/v1/rpc/community_read','POST',{p:{org,page:number('page',1,100000,1),rankPage:number('rankPage',1,100000,1),year:number('year',1900,2200,Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date())))}});
 return NextResponse.json({...data,me,imageBase:config().base+'/storage/v1/object/public/community-activities/',avatarBase:config().base+'/storage/v1/object/public/office-awards/'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:503});}}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 const me=await identity(req);if(!me)return NextResponse.json({error:'Vui lòng đăng nhập bằng tài khoản đang hoạt động.'},{status:401});
 try{
 if(req.headers.get('content-type')?.includes('multipart/form-data')){
  await requireUploads();
  if(Number(req.headers.get('content-length'))>1100000)throw Error('Ảnh vượt quá 1 MB sau khi nén.');
  const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||!file.size||file.size>1048576||file.type!=='image/webp')throw Error('Chỉ nhận ảnh WebP tối đa 1 MB sau khi nén.');
  const bytes=Buffer.from(await file.arrayBuffer());if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Ảnh không hợp lệ.');
  const {base,key}=config(),path='images/'+randomUUID()+'.webp';const upload=await fetch(base+'/storage/v1/object/community-activities/'+path,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'image/webp'},body:bytes,signal:AbortSignal.timeout(20000)});if(!upload.ok)throw Error('Không tải được ảnh. Kiểm tra SQL 012.');return NextResponse.json({path});
 }
 const raw=await req.text();if(raw.length>250000)throw Error('Nội dung quá dài.');const p=JSON.parse(raw);
 if(!['save','delete'].includes(p.op)||p.id&&!uuid(p.id))throw Error('Thao tác không hợp lệ.');
 if(p.op==='delete'&&me.role!=='admin')return NextResponse.json({error:'Chỉ admin được xóa hoạt động.'},{status:403});
 if(p.op==='save'){
  if(!['union','women','youth'].includes(p.org)||typeof p.title!=='string'||!p.title.trim()||p.title.length>200||typeof p.content!=='string'||p.content.length>10000||typeof p.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date)throw Error('Kiểm tra tiêu đề, ngày và nội dung.');
  if(!Array.isArray(p.members)||!p.members.every(uuid)||new Set(p.members).size!==p.members.length)throw Error('Chọn thành viên từ danh sách, không chọn trùng.');
  if(typeof p.image!=='string'||p.image&&!/^images\/[0-9a-f-]{36}\.webp$/.test(p.image))throw Error('Ảnh không hợp lệ.');
 }
 if(p.id&&(typeof p.version!=='string'||!Number.isFinite(Date.parse(p.version))))throw Error('Thiếu phiên bản hoạt động. Hãy tải lại.');
 const result=await sb('/rest/v1/rpc/community_write','POST',{p:{op:p.op,id:p.id||null,actor:me.id,version:p.version,org:p.org,title:p.title,date:p.date,content:p.content,image:p.image,members:p.members}});return NextResponse.json(result);
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}
}
