export type Question = {id:string;question:string;options:Record<string,string>;correct_answer:string;explanation:string;source:{location:string};section:string};
export function packageSizes(total:number){return [...new Set([...([20,50,100].filter(n=>n<total)),total])].filter(n=>n>0);}
export function sampleQuestions<T>(items:readonly T[],count:number,random:()=>number=Math.random):T[]{
 if(!Number.isInteger(count)||count<1||count>items.length)throw new Error('Số câu không hợp lệ');
 const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,count);
}
export function summarize(questions:Question[],answers:Record<string,string>){
 const correct=questions.filter(q=>answers[q.id]===q.correct_answer).length;
 const answered=questions.filter(q=>Object.hasOwn(q.options,answers[q.id])).length;
 return {correct,wrong:answered-correct,unanswered:questions.length-answered,total:questions.length,percent:questions.length?Math.round(correct/questions.length*100):0};
}
