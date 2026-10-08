// Convert a frame in the visible object-fit:cover preview into source-video pixels.
export function cameraCrop(videoWidth:number,videoHeight:number,viewWidth:number,viewHeight:number,frame:{left:number;top:number;width:number;height:number}){
 if([videoWidth,videoHeight,viewWidth,viewHeight,frame.width,frame.height].some(v=>!Number.isFinite(v)||v<=0))throw Error('Camera chưa sẵn sàng.');
 const scale=Math.max(viewWidth/videoWidth,viewHeight/videoHeight),offsetX=(videoWidth*scale-viewWidth)/2,offsetY=(videoHeight*scale-viewHeight)/2;
 const x=Math.max(0,Math.min(videoWidth,(frame.left+offsetX)/scale)),y=Math.max(0,Math.min(videoHeight,(frame.top+offsetY)/scale));
 return {x,y,width:Math.min(videoWidth-x,frame.width/scale),height:Math.min(videoHeight-y,frame.height/scale)};
}
