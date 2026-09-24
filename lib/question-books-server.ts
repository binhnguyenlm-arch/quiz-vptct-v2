import 'server-only';
import type {QuestionBook} from './question-books';
export async function bookDb(path:string,method='GET',body?:unknown){
 const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Chưa cấu hình dữ liệu.');
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Chưa kết nối được kho bộ đề. Kiểm tra SQL 018.');return r.json();
}
export async function publishedBook(id:string):Promise<QuestionBook&{questions:NonNullable<QuestionBook['questions']>}>{
 if(!/^[a-f0-9-]{36}$/i.test(id))throw Error('Bộ đề không hợp lệ.');
 const rows=await bookDb('question_books?id=eq.'+id+'&status=eq.published&select=*');if(!rows[0])throw Error('Bộ đề chưa công bố hoặc đã được thu hồi.');return rows[0];
}
