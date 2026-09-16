// A4 equivalent: 3,000 characters, including question and options, per page.
export function questionPages(items:{question:string;options:Record<string,string>}[]){return Math.max(1,Math.ceil(items.reduce((n,q)=>n+Array.from(q.question).length+Object.values(q.options).reduce((a,v)=>a+Array.from(v).length,0)+12,0)/3000));}
