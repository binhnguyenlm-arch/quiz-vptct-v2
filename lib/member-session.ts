import 'server-only';
import {NextRequest} from 'next/server';
export async function memberSession(req:NextRequest):Promise<{id:string;name:string}|null>{
 const token=req.cookies.get('learning_session')?.value;if(!token)return null;
 const base=process.env.SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
 const get=async(path:string,bearer:string)=>{const r=await fetch(base.replace(/\/$/,'')+path,{headers:{apikey:key,Authorization:`Bearer ${bearer}`},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('SESSION');return r.json();};
 const user=await get('/auth/v1/user',token);const people=await get(`/rest/v1/learning_people?id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id,name`,key);if(!people[0])throw Error('SESSION');return {id:people[0].id,name:people[0].name};
}
