import type {Campaign} from './commendations';

export function validateAwardRange(from:string,to:string){
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2999-12-31'&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(from)||!valid(to))throw Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp lệ.');
 if(from>to)throw Error('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
}
export function awardExportRows(events:Campaign[],from:string,to:string){
 validateAwardRange(from,to);
 return events.filter(c=>c.published&&c.date&&c.date>=from&&c.date<=to).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).flatMap(c=>{
  const base={date:c.date,title:c.title,description:c.description};
  const rows=[...(c.collectives||[]).map(h=>({...base,collective:h.name,person:'',award:h.award})),...(c.honorees||[]).map(h=>({...base,collective:'',person:h.name,award:h.award}))];
  return rows.length?rows:[{...base,collective:'',person:'',award:''}];
 });
}
export async function createAwardsWorkbook(events:Campaign[],from:string,to:string,demo=false){
 const rows=awardExportRows(events,from,to);
 if(!rows.length)throw Error('Không có nội dung đã công bố trong khoảng thời gian này.');
 const {default:Excel}=await import('exceljs');const book=new Excel.Workbook();
 const sheet=book.addWorksheet('Tong hop',{views:[{state:'frozen',ySplit:4}]});
 sheet.columns=[{width:7},{width:15},{width:40},{width:65},{width:28},{width:28},{width:36}];
 sheet.mergeCells('A1:G1');sheet.getCell('A1').value=(demo?'DỮ LIỆU MINH HỌA · ':'')+'TỔNG HỢP THI ĐUA, KHEN THƯỞNG';
 sheet.mergeCells('A2:G2');sheet.getCell('A2').value=`Từ ${from.split('-').reverse().join('/')} đến ${to.split('-').reverse().join('/')} (bao gồm hai ngày)`;
 sheet.mergeCells('A3:G3');sheet.getCell('A3').value='Lọc theo mốc thời gian đã ghi của đợt. Chỉ gồm nội dung đã công bố; ô trống là chưa cập nhật.';
 sheet.addRow(['STT','Thời gian','Nội dung thi đua, khen thưởng','Nội dung mô tả','Tên tập thể','Tên cá nhân','Hình thức khen thưởng']);
 rows.forEach((r,i)=>{const row=sheet.addRow([i+1,new Date(r.date+'T00:00:00Z'),r.title,r.description,r.collective,r.person,r.award]);row.getCell(2).numFmt='dd/mm/yyyy';row.height=Math.min(300,Math.max(42,Math.ceil(r.description.length/55)*16));});
 sheet.eachRow((row,index)=>{row.eachCell({includeEmpty:true},cell=>{cell.font={name:'Arial',size:11,color:{argb:'FF183C50'}};cell.alignment={vertical:'top',wrapText:true};if(index>=4)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:index===4?'FF173F55':index%2?'FFF1F6F8':'FFFFFFFF'}};if(index===4)cell.font={name:'Arial',size:11,bold:true,color:{argb:'FFFFFFFF'}};});});
 sheet.getRow(1).font={name:'Arial',size:16,bold:true,color:{argb:'FF173F55'}};sheet.getRow(1).height=32;sheet.getRow(3).height=32;sheet.getRow(4).height=34;
 sheet.autoFilter='A4:G'+sheet.rowCount;sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
 return {book,count:rows.length};
}

