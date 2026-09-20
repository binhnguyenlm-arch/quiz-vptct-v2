import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {validateCampaign} from '../../../lib/commendations';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const bucket='office-awards';
function config(){const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình kết nối.');return {base:base.replace(/\/$/,''),key};}
async function sb(path:string,method='GET',body?:unknown,token?:string){const {base,key}=config();const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Không kết nối được phân hệ. Kiểm tra đã chạy cập nhật SQL 009 và 010 và thử lại.');return r.status===204?null:r.json();}
async function admin(req:NextRequest){const token=req.cookies.get('learning_session')?.value;if(!token)return false;try{const u=await sb('/auth/v1/user','GET',undefined,token);const a=await sb(`/rest/v1/learning_people?id=eq.${encodeURIComponent(u.id)}&active=eq.true&role=eq.admin&select=id`);return a.length>0;}catch{return false;}}
async function all(path:string){const rows:any[]=[];for(let offset=0;;offset+=1000){const page=await sb(path+'&limit=1000&offset='+offset);rows.push(...page);if(page.length<1000)return rows;}}
export async function GET(req:NextRequest){try{
 const isAdmin=await admin(req),manage=req.nextUrl.searchParams.get('manage')==='1';if(manage&&!isAdmin)return NextResponse.json({error:'Vui lòng đăng nhập bằng tài khoản admin.'},{status:403});
 const year=req.nextUrl.searchParams.get('year');if(year&&!/^(0|[12]\d{3})$/.test(year))return NextResponse.json({error:'Năm không hợp lệ.'},{status:400});
 const visibility=manage?'':'&published=eq.true';const dates=await all('/rest/v1/office_campaigns?select=date&order=date.desc.nullslast,id'+visibility);const years=[...new Set(dates.map(d=>d.date?Number(d.date.slice(0,4)):0))];
 const selected=year!==null?Number(year):years[0]??new Date().getFullYear();const scope=selected?'&date=gte.'+selected+'-01-01&date=lt.'+(selected+1)+'-01-01':'&date=is.null';
 const events=await all('/rest/v1/office_campaigns?select=*&order=date.desc.nullslast,created_at.desc,id'+visibility+scope);
 const people=manage?await all('/rest/v1/learning_people?select=id,name,position,photo,username&deleted_at=is.null&order=created_at.asc,id'):[];
 for(const c of events){c.date=c.date||'';}
 return NextResponse.json({events,years,year:selected,admin:isAdmin,people,imageBase:config().base+'/storage/v1/object/public/'+bucket+'/'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:503});}}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(!await admin(req))return NextResponse.json({error:'Chỉ admin được cập nhật thi đua, khen thưởng.'},{status:403});
 try{
 if(req.headers.get('content-type')?.includes('multipart/form-data')){
  if(Number(req.headers.get('content-length'))>1100000)throw Error('Ảnh vượt quá 1 MB.');
  const data=await req.formData(),file=data.get('file');if(!(file instanceof File)||file.size>1048576||file.type!=='image/webp')throw Error('Chỉ nhận ảnh WebP tối đa 1 MB.');
  const bytes=Buffer.from(await file.arrayBuffer());if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Tệp ảnh không hợp lệ.');
  const path='images/'+randomUUID()+'.webp',{base,key}=config();const r=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'image/webp','Cache-Control':'31536000'},body:bytes,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Không tải được ảnh. Kiểm tra SQL 009 và dung lượng lưu trữ.');return NextResponse.json({path});
 }
 const raw=await req.text();if(raw.length>150000)throw Error('Nội dung quá dài.');const p=JSON.parse(raw);
 if(p.id&&!/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(p.id))throw Error('Mã đợt không hợp lệ.');
 if(p.op==='profile'){
 if(!p.id||typeof p.position!=='string'||p.position.length>150||typeof p.photo!=='string'||p.photo&&!/^images\/[0-9a-f-]{36}\.webp$/.test(p.photo))throw Error('Thông tin hồ sơ không hợp lệ.');
 await sb('/rest/v1/learning_people?id=eq.'+p.id+'&deleted_at=is.null','PATCH',{position:p.position.trim(),photo:p.photo});return NextResponse.json({ok:true});
 }
 if(p.op==='delete'){if(!p.id)throw Error('Chọn đợt cần xóa.');await sb('/rest/v1/office_campaigns?id=eq.'+p.id,'DELETE');return NextResponse.json({ok:true});}
 if(p.op!=='save')throw Error('Thao tác không hợp lệ.');const data=validateCampaign(p);
 for(const h of data.honorees){const people=await sb('/rest/v1/learning_people?id=eq.'+h.person_id+'&deleted_at=is.null&select=name,position,photo');if(!people.length)throw Error('Tài khoản đã bị xóa. Hãy chọn lại người nhận.');Object.assign(h,people[0]);}
 const rows=await sb('/rest/v1/office_campaigns'+(p.id?'?id=eq.'+p.id:''),p.id?'PATCH':'POST',{...data,date:data.date||null});if(!rows?.length)throw Error('Đợt không còn tồn tại.');return NextResponse.json({ok:true,id:rows[0].id});
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}
}
