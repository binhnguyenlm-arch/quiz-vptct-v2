export const politicsAudiences=[{id:'command',title:'Diện Binh đoàn quản lý'},{id:'party',title:'Đảng viên'},{id:'public',title:'Quần chúng'}] as const;
export const questionSeconds=120;
export type PoliticsQuestion={id:string;number:string;question:string;options:Record<string,string>;correct_answer:string;source:{location:string}};
export type PracticeState={remaining:string[];wrong:string[];completed:number;round:{ids:string[];index:number;answers:Record<string,string>;deadline:number;timeouts:number;status:'active'|'done'|'aborted';review:boolean}|null};
export function newPractice(ids:string[]):PracticeState{return {remaining:ids,wrong:[],completed:0,round:null};}
export function beginPractice(state:PracticeState):PracticeState{const retry=state.round?.status==='aborted'?state.round:null;const source=retry?retry.ids:state.remaining.length?state.remaining:state.wrong;const ids=[...source];for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return {...state,round:{ids:ids.slice(0,100),index:0,answers:{},deadline:Date.now()+120000,timeouts:0,status:'active',review:retry?retry.review:!state.remaining.length}};}
export function advancePractice(state:PracticeState,questions:PoliticsQuestion[],now:number,answer?:string):PracticeState{
 const s=structuredClone(state),r=s.round;if(!r||r.status!=='active')return s;
 while(now>=r.deadline&&r.status==='active'){r.timeouts++;r.index++;r.deadline+=120000;if(r.timeouts>=10)r.status='aborted';else if(r.index>=r.ids.length)r.status='done';}
 if(answer!==undefined&&r.status==='active'&&state.round?.index===r.index){const q=questions.find(q=>q.id===r.ids[r.index]);if(!q?.options[answer])return s;r.answers[q.id]=answer;r.timeouts=0;r.index++;r.deadline=now+120000;if(r.index>=r.ids.length)r.status='done';}
 if(r.status==='done'){
 const wrong=new Set(s.wrong);for(const id of r.ids){const q=questions.find(q=>q.id===id);if(q&&r.answers[id]===q.correct_answer)wrong.delete(id);else wrong.add(id);}
 s.wrong=[...wrong];if(!r.review){s.remaining=s.remaining.filter(id=>!r.ids.includes(id));s.completed+=r.ids.length;}
 }return s;
}
