export type LookupReader={read:(file:File,signal:AbortSignal,progress:(message:string)=>void)=>Promise<string>;dispose:()=>void};
function abortable<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{
 return new Promise((resolve,reject)=>{const stop=()=>{signal.removeEventListener('abort',stop);reject(new DOMException('Đã hủy','AbortError'));};if(signal.aborted){stop();promise.catch(()=>{});return;}signal.addEventListener('abort',stop,{once:true});promise.then(value=>{signal.removeEventListener('abort',stop);resolve(value);},error=>{signal.removeEventListener('abort',stop);reject(error);});});
}
// Prepare without an image before enabling capture. Each image gets its own worker;
// terminate immediately after reading, then prepare a clean worker for the next image.
export async function prepareLookupReader(signal:AbortSignal):Promise<LookupReader>{
 const {createWorker,PSM}=await abortable(import('tesseract.js'),signal);
 let report:(message:string)=>void=()=>{};
 const worker=await abortable(createWorker(['vie','eng'],1,{workerPath:'/ocr/worker.min.js',workerBlobURL:false,corePath:'/ocr/core',langPath:'/ocr/lang',cacheMethod:'write',errorHandler:()=>{},logger:m=>{if(m.status==='recognizing text')report('Đang đọc câu hỏi… '+Math.round(m.progress*100)+'%');}}).then(w=>{if(signal.aborted){void w.terminate();throw new DOMException('Đã hủy','AbortError');}return w;}),signal);
 let disposed=false;const dispose=()=>{if(!disposed){disposed=true;report=()=>{};void worker.terminate();}};
 try{await abortable(worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,user_defined_dpi:'300'}),signal);}catch(e){dispose();throw e;}
 return {dispose,async read(file,readSignal,progress){
  let url:string|null=null,canvas:HTMLCanvasElement|null=null;const img=new Image();
  try{
   if(disposed||readSignal.aborted)throw new DOMException('Đã hủy','AbortError');
   if(file.size>12*1024*1024)throw Error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 12 MB.');
   if(file.type&&!file.type.startsWith('image/'))throw Error('Vui lòng chọn một hình ảnh.');
   report=progress;url=URL.createObjectURL(file);img.src=url;await abortable(img.decode(),readSignal);
   if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>60000000)throw Error('Ảnh quá lớn hoặc không đọc được. Hãy chụp riêng một câu.');
   const scale=Math.min(1.5,2000/Math.max(img.naturalWidth,img.naturalHeight));canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Trình duyệt không hỗ trợ xử lý ảnh.');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);img.src='';URL.revokeObjectURL(url);url=null;
   const result=await abortable(worker.recognize(canvas,{rotateAuto:true},{text:true}),readSignal);return result.data.text;
  }finally{img.src='';if(url)URL.revokeObjectURL(url);if(canvas){canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);canvas.width=canvas.height=0;}dispose();}
 }};
}
