import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('config');
 const response=await fetch(base+'/rest/v1/rpc/office_home_preview',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('read');
 const data=await response.json();if(!Array.isArray(data))throw Error('data');
 const rows=data.slice(0,5).map(({id,content,due_at,status})=>({id,content,due_at,status}));
 return NextResponse.json({rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Chưa tải được lịch công tác. Vui lòng thử lại.'},{status:503});}
}
