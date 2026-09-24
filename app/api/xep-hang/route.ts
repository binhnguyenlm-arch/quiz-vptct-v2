import {NextResponse} from 'next/server';
import bank from '../../../lib/banks/politics-test.json';
import {bankVersion,largestPackage} from '../../../lib/mock';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)throw Error('CONFIG');
  const r=await fetch(base+'/rest/v1/rpc/web_overall_ranking',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p:{banks:[{bank:bankVersion,total:largestPackage(bank.questions.length)}]}}),cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('DATABASE');const d=await r.json();
  return NextResponse.json({...d,rows:d.rows.map((row:{photo?:string})=>({...row,photo:row.photo&&/^images\/[0-9a-f-]{36}\.webp$/i.test(row.photo)?base+'/storage/v1/object/public/office-awards/'+row.photo:''}))},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Chưa tải được xếp hạng tổng hợp. Vui lòng thử lại; quản trị viên kiểm tra đã chạy SQL 016.'},{status:503});}
}
