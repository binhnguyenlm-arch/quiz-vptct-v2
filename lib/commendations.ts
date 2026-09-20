export type Honoree={person_id?:string;name:string;position:string;award:string;photo:string};
export type Collective={name:string;award:string;photo:string};
export type Campaign={id:string;title:string;date:string;period?:string;description:string;images:string[];honorees:Honoree[];collectives?:Collective[];published:boolean};
export function validateCampaign(p:any):Omit<Campaign,'id'>{
 const str=(v:unknown,max:number,required=false)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Kiểm tra nội dung các trường.');return v.trim();};
 const asset=(v:unknown)=>{const s=str(v,100);if(s&&!/^images\/[0-9a-f-]{36}\.webp$/.test(s))throw Error('Ảnh không hợp lệ.');return s;};
 const date=str(p.date||'',10);if(date&&(!/^[12]\d{3}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Ngày không hợp lệ.');
 if(!Array.isArray(p.images)||p.images.length>3||!Array.isArray(p.honorees)||!Array.isArray(p.collectives||[])||typeof p.published!=='boolean')throw Error('Dữ liệu không hợp lệ; tối đa 3 ảnh phát động.');
 const honorees=p.honorees.map((h:any)=>{if(typeof h.person_id!=='string'||!/^[0-9a-f-]{36}$/.test(h.person_id))throw Error('Chọn người từ danh sách tài khoản.');return {person_id:h.person_id,name:'',position:'',photo:'',award:str(h.award||'',200)};});
 if(new Set(honorees.map((h:Honoree)=>h.person_id)).size!==honorees.length)throw Error('Một người chỉ xuất hiện một lần trong đợt.');
 return {title:str(p.title,200,true),date,period:str(p.period||'',200),description:str(p.description||'',10000),images:p.images.map(asset),published:p.published,honorees,collectives:(p.collectives||[]).map((h:any)=>({name:str(h.name||'',200),award:str(h.award||'',200),photo:asset(h.photo||'')}))};
}
