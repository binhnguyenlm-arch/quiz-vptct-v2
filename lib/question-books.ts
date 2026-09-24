import type {Question} from './practice';
export const bookTopics=[{key:'law',title:'Pháp luật, quy chế, quy định'},{key:'military',title:'Quân sự – Quốc phòng'},{key:'planning',title:'Nghiệp vụ Kế hoạch tổng hợp'},{key:'relations',title:'Nghiệp vụ Đối ngoại'},{key:'archives',title:'Nghiệp vụ Văn thư lưu trữ'}];
export type QuestionBook={id:string;topic:string;title:string;status:'draft'|'published';question_count:number;published_at:string|null;updated_at:string;questions?:Question[];builtin?:boolean};
export const excelHeaders=['Mã câu','Nhóm nội dung','Câu hỏi','Đáp án A','Đáp án B','Đáp án C','Đáp án D','Đáp án đúng','Giải thích','Nguồn tài liệu'];
export function validateQuestions(value:unknown):Question[]{
 if(!Array.isArray(value)||value.length<1||value.length>500)throw Error('Mỗi bộ cần từ 1 đến 500 câu.');
 const ids=new Set<string>(),texts=new Set<string>();
 return value.map((q,i)=>{const prefix=`Câu ${i+1}: `;if(!q||typeof q!=='object')throw Error(prefix+'dữ liệu không hợp lệ.');
 const text=(v:unknown,max:number,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error(prefix+'nội dung thiếu hoặc quá dài.');return v.trim();};
 const id=text(q.id,60),question=text(q.question,4000);if(!/^[A-Za-z0-9_-]+$/.test(id)||ids.has(id))throw Error(prefix+'mã câu trùng hoặc không hợp lệ.');ids.add(id);
 const normalized=question.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g,' ');if(texts.has(normalized))throw Error(prefix+'trùng nội dung câu hỏi.');texts.add(normalized);
 const options=Object.fromEntries(['A','B','C','D'].map(k=>[k,text(q.options?.[k],2000)]));if(new Set(Object.values(options).map(s=>s.toLocaleLowerCase('vi'))).size!==4)throw Error(prefix+'các đáp án không được trùng nhau.');
 const correct_answer=text(q.correct_answer,1).toUpperCase();if(!['A','B','C','D'].includes(correct_answer))throw Error(prefix+'đáp án đúng phải là A, B, C hoặc D.');
 return {id,question,options,correct_answer,section:text(q.section,200,false)||'Kiến thức chung',explanation:text(q.explanation,4000),source:{location:text(q.source?.location,1000)}};
 });
}
