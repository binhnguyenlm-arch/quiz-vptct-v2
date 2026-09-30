export function vnInput(iso:string){return new Date(new Date(iso).getTime()+7*3600000).toISOString().slice(0,16);}
export function vnStamp(iso:string|null){return iso?new Date(iso).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'—';}
export function monthPeriod(year:number,month:number){const d=(y:number,m:number)=>new Date(Date.UTC(y,m-1,26)).toISOString().slice(0,10)+'T00:00:00+07:00';return {from:d(year,month-1),until:d(year,month)};}
export function yearPeriod(year:number){return {from:`${year}-01-01T00:00:00+07:00`,until:`${year+1}-01-01T00:00:00+07:00`};}
export function datePeriod(from:string,to:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||to<from)throw Error('Chọn khoảng ngày hợp lệ.');const next=new Date(to+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);return {from:from+'T00:00:00+07:00',until:next.toISOString().slice(0,10)+'T00:00:00+07:00'};}
