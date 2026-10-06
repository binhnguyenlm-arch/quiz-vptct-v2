export type PracticeCompletion={id:string;audience:string;questionIds:string[]};
const storageKey='politics-completions-pending-v1';
let sending:Promise<boolean>|null=null;
function read():PracticeCompletion[]{const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(raw)?raw:[];}
export function queuePracticeCompletion(item:PracticeCompletion){const queue=read();if(!queue.some(q=>q.id===item.id)){queue.push(item);localStorage.setItem(storageKey,JSON.stringify(queue));}}
export function flushPracticeCompletions():Promise<boolean>{
 if(sending)return sending;
 sending=(async()=>{try{for(const item of read()){
  const res=await fetch('/api/luot-hoc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item),signal:AbortSignal.timeout(15000)});
  if(!res.ok)return false;
  // Re-read so a newly completed round is not lost while this request is in flight.
  localStorage.setItem(storageKey,JSON.stringify(read().filter(q=>q.id!==item.id)));
 }return read().length===0;}catch{return false;}})().finally(()=>{sending=null;});return sending;
}
