import {getDocument,GlobalWorkerOptions} from './pdf.mjs';
GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.mjs';
if(!window.vptctPdfReady){
 window.vptctPdfReady=true;
 document.addEventListener('pdf-load',async e=>{
  const box=e.target;if(!box.dataset.pdfUrl)return;let cancelled=false;let task;const cancel=()=>{cancelled=true;task?.destroy();};box.addEventListener('pdf-cancel',cancel,{once:true});box.dataset.ready='false';box.replaceChildren();const status=document.createElement("p");status.textContent="Đang mở PDF…";box.append(status);
  try{task=getDocument({url:box.dataset.pdfUrl,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/',isEvalSupported:false});const pdf=await task.promise;
   for(let i=1;i<=pdf.numPages;i++){if(cancelled)return;status.textContent=`Đang tải trang ${i} / ${pdf.numPages}…`;const page=await pdf.getPage(i),base=page.getViewport({scale:1});const scale=Math.min((box.clientWidth-32)/base.width,1.2),viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;canvas.style.maxWidth='100%';canvas.setAttribute('aria-label',`Trang ${i} / ${pdf.numPages}`);box.append(canvas);await page.render({canvasContext:canvas.getContext('2d'),canvas,viewport}).promise;const label=document.createElement('p');label.textContent=`Trang ${i} / ${pdf.numPages}`;box.append(label);page.cleanup();}
   if(!cancelled){status.textContent='Đã tải đầy đủ tài liệu.';box.dataset.ready='true';box.dispatchEvent(new Event('pdf-ready'));}
  }catch{if(!cancelled)box.dispatchEvent(new CustomEvent('pdf-error',{detail:'Không đọc được PDF. Tài liệu có thể được bảo vệ bằng mật khẩu hoặc kết nối bị gián đoạn.'}));}
 },true);
}
