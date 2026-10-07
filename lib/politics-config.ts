export const politicsAudiences=[{id:'command',title:'Diện Binh đoàn quản lý'},{id:'party',title:'Đảng viên'},{id:'public',title:'Quần chúng'}] as const;
export const questionSeconds=120;
export type PoliticsQuestion={id:string;number:string;question:string;options:Record<string,string>;correct_answer:string;source:{location:string}};
export type PracticeState={remaining:string[];wrong:string[];bookmarked?:string[];completed:number;round:{id?:string;ids:string[];index:number;answers:Record<string,string>;deadline:number;timeouts:number;status:'active'|'done'|'aborted';review:boolean}|null};
export function newPractice(ids:string[]):PracticeState{return {remaining:ids,wrong:[],completed:0,round:null};}
function shuffleIds(ids:string[]){const result=[...ids];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function mixedQuestionIds(all:string[],wrong:string[],count:number,unseen:string[]=[]){
 const valid=new Set(all),chosen=new Set<string>();
 for(const group of [wrong,unseen,all])for(const id of shuffleIds([...new Set(group)])){if(chosen.size>=count)break;if(valid.has(id))chosen.add(id);}
 return shuffleIds([...chosen]);
}
export function beginPractice(state:PracticeState,count=100,mixedPool?:string[]):PracticeState{
 if(!Number.isInteger(count)||count<1||count>100)throw Error('Gói ôn không hợp lệ');
 const retry=state.round?.status==='aborted'?state.round:null;
 const ids=retry?shuffleIds(retry.ids):mixedPool?mixedQuestionIds(mixedPool,state.wrong,count,state.remaining):shuffleIds(state.remaining.length?state.remaining:state.wrong).slice(0,count);
 return {...state,round:{id:crypto.randomUUID(),ids,index:0,answers:{},deadline:Date.now()+120000,timeouts:0,status:'active',review:retry?retry.review:!state.remaining.length}};
}
export function advancePractice(state:PracticeState,questions:PoliticsQuestion[],now:number,answer?:string):PracticeState{
 const s=structuredClone(state),r=s.round;if(!r||r.status!=='active')return s;
 while(now>=r.deadline&&r.status==='active'){r.timeouts++;r.index++;r.deadline+=120000;if(r.timeouts>=10)r.status='aborted';else if(r.index>=r.ids.length)r.status='done';}
 if(answer!==undefined&&r.status==='active'&&state.round?.index===r.index){const q=questions.find(q=>q.id===r.ids[r.index]);if(!q?.options[answer])return s;r.answers[q.id]=answer;r.timeouts=0;r.index++;r.deadline=now+120000;if(r.index>=r.ids.length)r.status='done';}
 if(r.status==='done'){
 const wrong=new Set(s.wrong);for(const id of r.ids){const q=questions.find(q=>q.id===id);if(q&&r.answers[id]===q.correct_answer)wrong.delete(id);else wrong.add(id);}
 s.wrong=[...wrong];const newlyStudied=s.remaining.filter(id=>r.ids.includes(id)).length;s.remaining=s.remaining.filter(id=>!r.ids.includes(id));s.completed+=newlyStudied;
 }return s;
}

export function togglePracticeBookmark(state:PracticeState,id:string):PracticeState{const ids=new Set(state.bookmarked||[]);if(ids.has(id))ids.delete(id);else ids.add(id);return {...state,bookmarked:[...ids]};}
export function beginBookmarkedPractice(state:PracticeState,count=100):PracticeState{
 const ids=[...new Set(state.bookmarked||[])];
 if(!ids.length)return state;
 const next=beginPractice({...state,remaining:ids,round:null},count);
 return {...state,round:{...next.round!,review:true}};
}
