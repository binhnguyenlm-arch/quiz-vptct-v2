'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {findLookup,makeLookupIndex,type LookupHit,type LookupResult} from '../lib/lookup-match';
import {prepareLookupReader,type LookupReader} from '../lib/lookup-ocr';
import {loginHref} from '../lib/login-navigation';
import styles from './Lookup.module.css';
type Access={me:{name:string;admin:boolean}|null;allowed:boolean};
type Person={id:string;name:string;username:string};
const names:Record<string,string>={command:'Binh đoàn quản lý',party:'Đảng viên',public:'Quần chúng'};
async function api(view='',init?:RequestInit){const r=await fetch('/api/tra-cuu'+(view?'?view='+view:''),{...init,cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Chưa kết nối được. Vui lòng thử lại.');return d;}
export default function Lookup(){
 const [access,setAccess]=useState<Access|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[result,setResult]=useState<LookupResult|null>(null),[selected,setSelected]=useState<LookupHit|null>(null),[manual,setManual]=useState(false);
 const [people,setPeople]=useState<Person[]|null>(null),[grants,setGrants]=useState<string[]>([]),[filter,setFilter]=useState(''),[saving,setSaving]=useState(''),[adminMessage,setAdminMessage]=useState('');
 const [ready,setReady]=useState(false),[preparing,setPreparing]=useState(false),[elapsed,setElapsed]=useState<number|null>(null),[hasStarted,setHasStarted]=useState(false);
 const reader=useRef<LookupReader|null>(null),prepAbort=useRef<AbortController|null>(null),prepGeneration=useRef(0),allowed=useRef(false),mounted=useRef(true);
 const camera=useRef<HTMLInputElement>(null),library=useRef<HTMLInputElement>(null),index=useRef<ReturnType<typeof makeLookupIndex>|null>(null),abort=useRef<AbortController|null>(null),generation=useRef(0);
 function clear(){generation.current++;abort.current?.abort();abort.current=null;setResult(null);setSelected(null);setManual(false);setBusy(false);setProgress('');setElapsed(null);if(camera.current)camera.current.value='';if(library.current)library.current.value='';}
 async function check(signal?:AbortSignal){const next:Access=await api('',{signal});if(!mounted.current)return next;allowed.current=next.allowed;setAccess(next);if(!next.allowed){clear();index.current=null;}return next;}
 async function prepare(){
  if(!allowed.current||!mounted.current)return;const run=++prepGeneration.current;prepAbort.current?.abort();reader.current?.dispose();reader.current=null;setReady(false);setPreparing(true);const controller=new AbortController();prepAbort.current=controller;const timeout=setTimeout(()=>controller.abort(),60000);
  try{if(!index.current){const bank=await api('bank',{signal:controller.signal});if(run!==prepGeneration.current)return;index.current=makeLookupIndex(bank.questions);}const next=await prepareLookupReader(controller.signal);if(run!==prepGeneration.current||!allowed.current){next.dispose();return;}reader.current=next;setReady(true);}
  catch(e){if(run===prepGeneration.current&&allowed.current)setError('Chưa chuẩn bị xong bộ nhận dạng. Kiểm tra mạng rồi bấm Chuẩn bị lại. '+((e as Error).name==='AbortError'?'':(e as Error).message));}
  finally{clearTimeout(timeout);if(run===prepGeneration.current){setPreparing(false);prepAbort.current=null;}}
 }
 useEffect(()=>{allowed.current=!!access?.allowed;if(allowed.current)void prepare();return()=>{allowed.current=false;prepGeneration.current++;prepAbort.current?.abort();reader.current?.dispose();reader.current=null;setReady(false);};},[access?.allowed]);
 useEffect(()=>{mounted.current=true;let alive=true;api().then(d=>{if(alive)setAccess(d);}).catch(e=>{if(alive)setError(e.message);});
  const refresh=()=>{if(document.visibilityState==='visible')void check().catch(()=>{allowed.current=false;clear();index.current=null;setAccess(null);setError('Không xác minh được quyền. Vui lòng tải lại trang.');});};
  document.addEventListener('visibilitychange',refresh);window.addEventListener('office-session-change',refresh);const timer=setInterval(refresh,30000);
  return()=>{alive=false;mounted.current=false;generation.current++;abort.current?.abort();index.current=null;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('office-session-change',refresh);};
 // Session polling intentionally reads current refs, not captured lookup results.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function capture(file:File){
  if(!reader.current||!index.current)return;const currentReader=reader.current;reader.current=null;setReady(false);setHasStarted(true);
  clear();setError('');setBusy(true);const run=generation.current,controller=new AbortController();abort.current=controller;const started=performance.now();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
   let text=await currentReader.read(file,controller.signal,message=>{if(run===generation.current)setProgress(message);});
   if(run!==generation.current)return;const found=findLookup(text,index.current!);text='';
   const latest=await check(controller.signal);if(!latest.allowed||run!==generation.current||controller.signal.aborted)return;setResult(found);setSelected(found.automatic?found.hits[0]:null);setElapsed((performance.now()-started)/1000);
  }catch(e){if(run===generation.current)setError((e as Error).name==='AbortError'?'Chưa nhận dạng chắc chắn trong 20 giây. Hãy chụp gần hơn, đủ sáng và chỉ một câu.':(e as Error).message||'Không đọc được ảnh. Hãy dùng ảnh JPG hoặc PNG.');}
  finally{clearTimeout(timeout);currentReader.dispose();if(run===generation.current){setBusy(false);setProgress('');abort.current=null;}if(allowed.current&&!reader.current)void prepare();}
 }
 function picked(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(file)void capture(file);}
 async function admin(){setAdminMessage('');try{const d=await api('admin');setPeople(d.people);setGrants(d.permissions.map((p:{person_id:string})=>p.person_id));}catch(e){setAdminMessage((e as Error).message);}}
 async function grant(person:string,allowed:boolean){setSaving(person);setAdminMessage('');try{await api('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({person,allowed})});setGrants(g=>allowed?[...g.filter(x=>x!==person),person]:g.filter(x=>x!==person));await check();setAdminMessage('Đã cập nhật quyền.');}catch(e){setAdminMessage((e as Error).message);}finally{setSaving('');}}
 async function choose(hit:LookupHit){try{if((await check()).allowed){setSelected(hit);setManual(true);}}catch(e){setError((e as Error).message);}}
 return <main className={styles.wrap}>
  <Link href="/" className={styles.back}>← Trang chủ</Link><header className={styles.header}><span>CÔNG CỤ VĂN PHÒNG</span><h1>Tra cứu</h1></header>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {!access&&!error&&<p role="status">Đang kiểm tra tài khoản…</p>}
  {!access&&error&&<button onClick={()=>{setError('');void check().catch(e=>setError(e.message));}}>Thử kết nối lại</button>}
  {access&&!access.me&&<section className={styles.card}><p>Vui lòng đăng nhập để tiếp tục.</p><Link className={styles.primary} href={loginHref('/cong-cu/tra-cuu')}>Đăng nhập →</Link></section>}
  {access?.me&&!access.allowed&&<section className={styles.card}><p>Tài khoản chưa được cấp quyền sử dụng. Vui lòng liên hệ cán bộ phụ trách.</p></section>}
  {access?.allowed&&<>
   {!hasStarted&&<div className={ready?styles.ready:styles.preparing} role="status" aria-live="polite"><strong>{ready?'ĐÃ SẴN SÀNG':'VUI LÒNG CHƯA BẮT ĐẦU VÀO THI'}</strong><p>{ready?'Đã tải xong ngân hàng câu hỏi và bộ nhận dạng. Bạn có thể bắt đầu vào thi.':'Hệ thống đang chuẩn bị. Chỉ bắt đầu vào thi khi thông báo chuyển sang “Đã sẵn sàng”.'}</p></div>}
   <p className={styles.intro}>Chụp riêng một câu hỏi, rõ nội dung và tất cả phương án. Đáp án được lấy từ ngân hàng 900 câu của ba đối tượng.</p>
   <input ref={camera} type="file" accept="image/*" capture="environment" onChange={picked} className={styles.input} aria-label="Chụp câu hỏi"/>
   <input ref={library} type="file" accept="image/*" onChange={picked} className={styles.input} aria-label="Chọn ảnh từ thư viện"/>
   {busy?<section className={styles.card} aria-live="polite"><div className={styles.loader}/><p>{progress||'Đang xử lý…'}</p><p>Tự dừng sau tối đa 20 giây nếu chưa có kết quả.</p><button onClick={clear}>Hủy nhận dạng</button></section>:<>
    {selected&&<section className={styles.answer} aria-live="polite"><span>{manual?'Câu do bạn xác nhận':'Đã tìm thấy câu phù hợp'}</span><strong className={styles.letter}>{(!manual&&selected.imageAnswer)||selected.question.correct_answer}</strong><p className={styles.correct}>{selected.question.options[selected.question.correct_answer]}</p><p>Độ khớp {Math.round(selected.score*100)}% · Câu {selected.question.number} · {names[selected.question.audience]}</p><small>{!manual&&selected.imageAnswer?'Chữ cái theo phương án nhận dạng trong ảnh.':'Chữ cái theo thứ tự trong ngân hàng; đối chiếu nội dung nếu đề đổi thứ tự.'}</small><details><summary>Xem câu hỏi và phương án chuẩn</summary><Question hit={selected} answer/></details></section>}
    {result&&!selected&&<section className={styles.card}><p role="status">{result.reason}</p>{result.hits.map(hit=><article className={styles.candidate} key={hit.question.id}><span>Độ khớp {Math.round(hit.score*100)}% · {names[hit.question.audience]} · Câu {hit.question.number}</span><Question hit={hit}/><button onClick={()=>void choose(hit)}>Đây là câu tôi cần tra cứu</button></article>)}</section>}
    {elapsed!==null&&<p className={styles.timing}>Đã xử lý trong {elapsed.toFixed(1).replace('.',',')} giây</p>}
    <div className={styles.actions}><button disabled={!ready} className={styles.primary} onClick={()=>{clear();setError('');camera.current?.click();}}>📷 {result?'CHỤP CÂU TIẾP THEO':'CHỤP CÂU HỎI'}</button><button disabled={!ready} className={styles.secondary} onClick={()=>{clear();setError('');library.current?.click();}}>Chọn ảnh từ thư viện</button></div>
    {!ready&&<p role="status">{preparing?'Đang chuẩn bị sẵn để tra cứu nhanh. Lần đầu cần tải bộ nhận dạng tiếng Việt.':'Bộ nhận dạng chưa sẵn sàng.'}</p>}
    {!ready&&!preparing&&<button onClick={()=>{setError('');void prepare();}}>Chuẩn bị lại</button>}
   </>}
   <details className={styles.help}><summary>Hướng dẫn sử dụng</summary><ol><li>Đặt điện thoại thẳng, đủ sáng; chụp trọn một câu và các phương án. Có thể chọn ảnh chụp màn hình.</li><li>Đối chiếu nội dung đáp án, nhất là khi đề đổi thứ tự A/B/C/D. Câu chưa rõ sẽ cần bạn xác nhận.</li><li>Chọn “Chụp câu tiếp theo” để bắt đầu lượt mới. Ảnh chỉ được xử lý trên thiết bị, không gửi lên máy chủ và không lưu lịch sử.</li></ol><p>Độ khớp thể hiện mức giống nội dung, không phải cam kết xác suất đúng. Lần đầu cần mạng để tải bộ nhận dạng tiếng Việt. Ảnh nghiêng, mờ hoặc chữ nhỏ có thể cần chụp lại.</p></details>
  </>}
  {access?.me?.admin&&<section className={styles.admin}><button onClick={()=>people?setPeople(null):void admin()}>Quản lý quyền Tra cứu {people?'▴':'▾'}</button>{adminMessage&&<p role="status">{adminMessage}</p>}{people&&<><p>Cấp riêng cho từng tài khoản. Cán bộ phụ trách cũng cần được cấp quyền để sử dụng.</p><label>Tìm tài khoản<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Tên hoặc tên đăng nhập"/></label><ul>{people.filter(p=>(p.name+' '+p.username).toLocaleLowerCase('vi').includes(filter.toLocaleLowerCase('vi'))).map(p=><li key={p.id}><span>{p.name}<small>{p.username}</small></span><button disabled={!!saving} onClick={()=>void grant(p.id,!grants.includes(p.id))}>{saving===p.id?'Đang lưu…':grants.includes(p.id)?'Thu hồi':'Cấp quyền'}</button></li>)}</ul></>}</section>}
 </main>;
}
function Question({hit,answer=false}:{hit:LookupHit;answer?:boolean}){return <div><p><b>{hit.question.question}</b></p>{Object.entries(hit.question.options).map(([key,value])=><p key={key} style={answer&&key===hit.question.correct_answer?{color:'#126338',fontWeight:800}:undefined}>{key}. {value}</p>)}</div>;}

