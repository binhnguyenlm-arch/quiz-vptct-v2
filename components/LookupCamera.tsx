'use client';
import {useEffect,useRef,useState} from 'react';
import {cameraCrop} from '../lib/lookup-camera';
import styles from './LookupCamera.module.css';
export default function LookupCamera({onCapture,onClose,onFallback}:{onCapture:(file:File)=>void;onClose:()=>void;onFallback:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),frame=useRef<HTMLDivElement>(null),stream=useRef<MediaStream|null>(null),alive=useRef(true);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[height,setHeight]=useState(40),[shooting,setShooting]=useState(false);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 useEffect(()=>{alive.current=true;dialog.current?.showModal();let disposed=false;const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  async function start(){try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Trình duyệt chưa hỗ trợ camera trong trang. Hãy dùng camera điện thoại hoặc thư viện.');const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});if(disposed){s.getTracks().forEach(t=>t.stop());return;}stream.current=s;if(video.current){video.current.srcObject=s;await video.current.play();if(!disposed)setReady(true);}}
   catch(e){stop();if(!disposed)setError((e as Error).name==='NotAllowedError'?'Chưa được phép dùng camera. Anh có thể cho phép camera trong trình duyệt hoặc dùng cách chụp khác.':'Chưa mở được camera. Hãy thử camera điện thoại hoặc chọn ảnh từ thư viện.');}}
  void start();return()=>{disposed=true;alive.current=false;stop();document.body.style.overflow=previous;};
 },[]);
 async function shoot(){if(!video.current||!frame.current||!ready||shooting)return;setShooting(true);let canvas:HTMLCanvasElement|null=null;
  try{const v=video.current,view=v.getBoundingClientRect(),f=frame.current.getBoundingClientRect();const crop=cameraCrop(v.videoWidth,v.videoHeight,view.width,view.height,{left:f.left-view.left,top:f.top-view.top,width:f.width,height:f.height});const ratio=Math.min(1,2000/Math.max(crop.width,crop.height));canvas=document.createElement('canvas');canvas.width=Math.round(crop.width*ratio);canvas.height=Math.round(crop.height*ratio);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Không xử lý được ảnh.');ctx.drawImage(v,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob|null>(resolve=>canvas!.toBlob(resolve,'image/jpeg',.94));if(!blob)throw Error('Không chụp được ảnh.');stop();if(alive.current)onCapture(new File([blob],'cau-hoi.jpg',{type:'image/jpeg'}));}
  catch{if(alive.current){setError('Chưa chụp được. Hãy đóng camera và thử lại.');setShooting(false);}}
  finally{if(canvas){canvas.width=canvas.height=0;}}
 }
 return <dialog ref={dialog} className={styles.dialog} onCancel={e=>{e.preventDefault();onClose();}} aria-label="Camera chụp câu hỏi"><header><b>Căn phần câu hỏi vào khung</b><button onClick={onClose} aria-label="Đóng camera">✕</button></header>
 <div className={styles.preview}><video ref={video} muted playsInline aria-label="Hình ảnh camera"/><div ref={frame} className={styles.frame} style={{height:height+'%'}}><span>Chỉ nhận dạng bên trong khung</span></div>{!ready&&!error&&<p className={styles.loading}>Đang mở camera…</p>}</div>
 <footer>{error?<p role="alert">{error}</p>:<label>Điều chỉnh chiều cao khung<input type="range" min="20" max="85" value={height} onChange={e=>setHeight(Number(e.target.value))}/></label>}
 <button className={styles.shutter} disabled={!ready||!!error||shooting} onClick={()=>void shoot()}>{shooting?'Đang chụp…':'📷 CHỤP TRONG KHUNG'}</button><button onClick={()=>{stop();onFallback();}}>Dùng camera điện thoại / thư viện</button></footer></dialog>;
}

