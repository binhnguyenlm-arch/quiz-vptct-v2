import {requireUploads} from '../../../lib/usage-controls';
import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 const token=req.cookies.get('learning_session')?.value;
 if(!token)return NextResponse.json({error:'Vui lòng đăng nhập lại.'},{status:401});
 const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:'Chưa cấu hình kết nối.'},{status:503});
 const headers={apikey:key,Authorization:`Bearer ${key}`};
 try{
  const auth=await fetch(base+'/auth/v1/user',{headers:{...headers,Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!auth.ok)return NextResponse.json({error:'Phiên đăng nhập đã hết hạn.'},{status:401});
  const user=await auth.json();if(typeof user.id!=='string'||!/^[0-9a-f-]{36}$/i.test(user.id))return NextResponse.json({error:'Phiên đăng nhập không hợp lệ.'},{status:401});
  const target=base+'/rest/v1/learning_people?id=eq.'+encodeURIComponent(user.id)+'&active=eq.true&deleted_at=is.null';
  const check=await fetch(target+'&select=id',{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!check.ok)throw Error('Không kiểm tra được tài khoản.');
  if(!(await check.json()).length)return NextResponse.json({error:'Tài khoản không còn hoạt động.'},{status:403});
  await requireUploads();
  if(Number(req.headers.get('content-length'))>1100000)throw Error('Ảnh vượt quá 1 MB sau khi xử lý.');
  const form=await req.formData(),file=form.get('file');
  if(!(file instanceof File)||!file.size||file.size>1048576||file.type!=='image/webp')throw Error('Ảnh không hợp lệ hoặc quá lớn.');
  const bytes=Buffer.from(await file.arrayBuffer());
  if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Tệp ảnh không hợp lệ.');
  const path='images/'+randomUUID()+'.webp';
  const upload=await fetch(base+'/storage/v1/object/office-awards/'+path,{method:'POST',headers:{...headers,'Content-Type':'image/webp'},body:bytes,signal:AbortSignal.timeout(20000)});
  if(!upload.ok)throw Error('Không tải được ảnh. Vui lòng thử lại.');
  const update=await fetch(target,{method:'PATCH',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({photo:path}),signal:AbortSignal.timeout(15000)});
  if(!update.ok||!(await update.json()).length)throw Error('Chưa lưu được ảnh vào tài khoản. Vui lòng thử lại.');
  return NextResponse.json({photo:base+'/storage/v1/object/public/office-awards/'+path},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Chưa cập nhật được ảnh.'},{status:400});}
}
