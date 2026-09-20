export type MockPackage={id:string;count:number;minutes:number;enabled:boolean};
export const mockPackages:MockPackage[]=[{id:'politics-20-v1',count:20,minutes:15,enabled:true},{id:'politics-50-v1',count:50,minutes:30,enabled:true},{id:'politics-100-v1',count:100,minutes:60,enabled:true}];
export const bankVersion='politics-test-119-v1';
export function availablePackages(total:number,packages:MockPackage[]=mockPackages){return packages.filter(p=>p.enabled&&p.count>0&&p.count<=total);}
export function largestPackage(total:number,packages:MockPackage[]=mockPackages){return Math.max(0,...availablePackages(total,packages).map(p=>p.count));}
export function normalizeName(input:string){return input.normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('vi').replace(/(^|[\s’'\-])\p{L}/gu,s=>s.toLocaleUpperCase('vi'));}
export function nameError(name:string){if(name.length<2||name.length>70)return 'Họ tên cần từ 2 đến 70 ký tự.';if(!/^[\p{L}\p{M}]+(?:[ ’'\-][\p{L}\p{M}]+)*$/u.test(name))return 'Vui lòng dùng chữ cho họ tên, không dùng số hoặc biểu tượng.';return '';}
export function celebration(rank:number|null,improved:boolean,eligible:boolean){if(!eligible)return 'Mỗi lần thử sức là một bước tiến. Tiếp tục ôn luyện để nâng cao thành tích!';if(!improved)return 'Bạn đã hoàn thành lượt thi thử. Tiếp tục ôn luyện để vượt thành tích tốt nhất của mình!';if(rank===1)return 'Chúc mừng bạn đạt thành tích dẫn đầu chuyên đề! Hãy tiếp tục giữ vững phong độ.';if(rank&&rank<=3)return 'Chúc mừng bạn lọt Top 3! Tiếp tục ôn luyện để chinh phục vị trí dẫn đầu.';return 'Mỗi lần thử sức là một bước tiến. Tiếp tục ôn luyện để nâng cao thành tích!';}
export function shuffledOptions<T extends {options:Record<string,string>;correct_answer:string}>(q:T,random:()=>number=Math.random):T{
 const entries=Object.entries(q.options);for(let i=entries.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}
 const options:Record<string,string>={};let correct='';entries.forEach(([oldKey,value],i)=>{const key=String.fromCharCode(65+i);options[key]=value;if(oldKey===q.correct_answer)correct=key;});return {...q,options,correct_answer:correct};
}
