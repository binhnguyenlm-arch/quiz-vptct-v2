import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
import {requireUploads} from '../../../lib/usage-controls';
import {r2TaskPut,r2TaskDelete,r2TaskRead} from '../../../lib/r2-documents';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const messages:Record<string,string>={EXPORT_LIMIT:'Có hơn 5.000 nhiệm vụ. Hãy chọn khoảng thời gian ngắn hơn.',FORBIDDEN:'Bạn không có quyền thực hiện thao tác này.',CONFLICT:'Nhiệm vụ vừa được cập nhật. Đóng khung, tải lại và mở lại nhiệm vụ trước khi lưu.',NOT_FOUND:'Không tìm thấy nhiệm vụ hoặc tệp.',CLOSED:'Nhiệm vụ đã hoàn thành. Hãy tải lại danh sách.',MEMBER:'Người được chọn không còn hoạt động. Hãy tải lại.',RESULT_REQUIRED:'Cần nhập nội dung kết quả.',INVALID:'Kiểm tra lại nội dung, phân công và thời hạn.'};
async function sb(path:string,body?:unknown,token?:string){const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình kết nối.');const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(18000)});const d=await r.json();if(!r.ok)throw Error(d.code==='23505'?'Loại nhiệm vụ này đã có.':messages[d.message]||'Chưa đọc được lịch. Kiểm tra đã chạy SQL 021 hoặc thử lại.');return d;}
async function identity(req:NextRequest){const token=req.cookies.get('learning_session')?.value;if(!token)return null;const u=await sb('/auth/v1/user',undefined,token);if(!uuid(u.id))return null;const p=await sb(`/rest/v1/learning_people?id=eq.${u.id}&active=eq.true&deleted_at=is.null&select=id,name,role`);return p[0]||null;}
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
const rpc=(p:unknown)=>sb('/rest/v1/rpc/office_task_action',{p});
export async function GET(req:NextRequest){try{const me=await identity(req);if(!me)return json({me:null},401);const q=req.nextUrl.searchParams,op=q.get('op')||'list';if(!['list','detail','file','export'].includes(op))throw Error('Yêu cầu không hợp lệ.');if(['detail','file'].includes(op)&&!uuid(q.get('id')))throw Error('Nhiệm vụ không hợp lệ.');const page=Number(q.get('page')||1);if(!Number.isInteger(page)||page<1||page>100000)throw Error('Trang không hợp lệ.');if(op==='file'&&!uuid(q.get('update_id')))throw Error('Tệp không hợp lệ.');if(op==='export'||q.get('tab')==='summary'){for(const k of ['from','until']){const v=q.get(k)||'';if(!/^\d{4}-\d{2}-\d{2}T00:00:00\+07:00$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Khoảng ngày không hợp lệ.');}if(Date.parse(q.get('until')!)<=Date.parse(q.get('from')!))throw Error('Ngày kết thúc phải sau ngày bắt đầu.');}if(q.get('category')&&!uuid(q.get('category')))throw Error('Loại không hợp lệ.');const d=await rpc({op,from:q.get('from'),until:q.get('until'),category:q.get('category'),date_field:q.get('date_field'),actor:me.id,id:q.get('id'),update_id:q.get('update_id'),page,tab:q.get('tab')||'all'});if(op==='file'){const stream=await r2TaskRead(d.key);return new NextResponse(stream,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(d.name).replace(/['()*]/g,(c:string)=>'%'+c.charCodeAt(0).toString(16)),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}return json({...d,me});}catch(e){return json({error:(e as Error).message},503);}}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Yêu cầu không hợp lệ.'},403);
 let uploaded:string|undefined;
 try{
 const me=await identity(req);if(!me)return json({error:'Vui lòng đăng nhập bằng tài khoản đang hoạt động.'},401);
 if(Number(req.headers.get('content-length'))>3300000)throw Error('Tệp tối đa 3 MB.');
 let p:Record<string,any>,file:File|undefined;
 if(req.headers.get('content-type')?.includes('multipart/form-data')){const f=await req.formData();const raw=f.get('payload');if(typeof raw!=='string'||raw.length>20000)throw Error('Nội dung không hợp lệ.');p=JSON.parse(raw);const v=f.get('file');if(v instanceof File&&v.size)file=v;}else{const raw=await req.text();if(raw.length>20000)throw Error('Nội dung quá dài.');p=JSON.parse(raw);}
 if(!p||!['create','edit','report','reopen','category'].includes(p.op))throw Error('Thao tác không hợp lệ.');
 if(!['create','category'].includes(p.op)&&(!uuid(p.id)||!Number.isInteger(p.version)||p.version<1))throw Error('Thiếu phiên bản nhiệm vụ. Hãy tải lại.');
 if(file&&p.op!=='report')throw Error('Chỉ đính kèm khi cập nhật kết quả.');
 let clean:Record<string,unknown>={op:p.op,actor:me.id,id:p.id,version:p.version};
 if(p.op==='category'){if(me.role!=='admin')return json({error:messages.FORBIDDEN},403);if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100)throw Error('Tên loại tối đa 100 ký tự.');return json(await rpc({op:'category',actor:me.id,name:p.name.trim()}));}
 if(['create','edit'].includes(p.op)){
  if(me.role!=='admin')return json({error:messages.FORBIDDEN},403);
  if(typeof p.content!=='string'||!p.content.trim()||p.content.length>4000||!uuid(p.lead_id)||!uuid(p.category_id)||!Array.isArray(p.helpers)||p.helpers.length>100||!p.helpers.every(uuid)||new Set(p.helpers).size!==p.helpers.length||p.helpers.includes(p.lead_id))throw Error(messages.INVALID);
  for(const v of [p.received_at,p.due_at])if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Ngày giờ không hợp lệ.');
  if(Date.parse(p.due_at)<Date.parse(p.received_at))throw Error('Hạn phải sau thời gian nhận.');
  clean={...clean,content:p.content.trim(),category_id:p.category_id,lead_id:p.lead_id,helpers:p.helpers,received_at:p.received_at,due_at:p.due_at};
 }else{
  if(typeof p.body!=='string'||!p.body.trim()||p.body.length>4000)throw Error(messages.RESULT_REQUIRED);
  if(p.op==='report'&&typeof p.complete!=='boolean')throw Error(messages.INVALID);
  clean={...clean,body:p.body.trim(),complete:p.complete};
 }
 if(file){
  // Authorize against current assignments BEFORE sending any bytes to storage.
  const d=await rpc({op:'detail',actor:me.id,id:p.id});
  const helpers=await sb(`/rest/v1/office_task_helpers?task_id=eq.${p.id}&person_id=eq.${me.id}&select=person_id`);
  if(d.task.completed_at||d.task.version!==p.version)throw Error(messages.CONFLICT);
  if(me.role!=='admin'&&d.task.lead_id!==me.id&&(!helpers.length||p.complete))throw Error(messages.FORBIDDEN);
  await requireUploads();
  if(file.size>3145728||file.name.length>180||/[\x00-\x1f\x7f/\\]/.test(file.name))throw Error('Tệp Word/PDF tối đa 3 MB, tên tối đa 180 ký tự.');
  const ext=file.name.split('.').pop()?.toLowerCase();const bytes=Buffer.from(await file.arrayBuffer());
  const mime:Record<string,string>={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
  if(!ext||!mime[ext])throw Error('Chỉ nhận .pdf, .doc hoặc .docx.');
  if(ext==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Tệp PDF không hợp lệ.');
  if(ext==='doc'&&bytes.subarray(0,8).toString('hex')!=='d0cf11e0a1b11ae1')throw Error('Tệp Word không hợp lệ.');
  if(ext==='docx'){const z=await JSZip.loadAsync(bytes);if(!z.file('[Content_Types].xml')||!z.file('word/document.xml')||z.file('word/vbaProject.bin'))throw Error('Tệp DOCX không hợp lệ.');}
  uploaded=`office-tasks/${p.id}/${randomUUID()}.${ext}`;await r2TaskPut(uploaded,bytes,mime[ext]);
  clean={...clean,file_key:uploaded,file_name:file.name,file_bytes:file.size};
 }
 const d=await rpc(clean);uploaded=undefined;return json(d);
 }catch(e){if(uploaded)await r2TaskDelete(uploaded).catch(()=>console.error('office-task attachment cleanup required',uploaded));return json({error:(e as Error).message},400);}
}
