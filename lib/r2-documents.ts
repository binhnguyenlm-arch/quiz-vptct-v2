import {S3Client,GetObjectCommand,PutObjectCommand,DeleteObjectCommand,HeadBucketCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

export const MAX_PDF_BYTES=20*1024*1024;
const objectPattern=/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.pdf$/;
export function isR2Path(path:string){return path.startsWith('r2/');}
export function documentKey(path:string){const key=isR2Path(path)?path.slice(3):path;if(!objectPattern.test(key))throw Error('Đường dẫn PDF không hợp lệ.');return key;}
export function r2Configured(){return ['R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'].every(k=>Boolean(process.env[k]?.trim()));}
function config(){
 if(!r2Configured())throw Error('Chưa đủ 4 biến kết nối R2 trên Vercel.');
 const endpoint=new URL(process.env.R2_ENDPOINT!.trim());
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.r2.cloudflarestorage.com')||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')throw Error('R2_ENDPOINT chưa đúng địa chỉ S3 của Cloudflare.');
 const bucket=process.env.R2_BUCKET!.trim();if(!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket))throw Error('Tên kho R2 không hợp lệ.');
 return {bucket,client:new S3Client({region:'auto',endpoint:endpoint.origin,forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID!.trim(),secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!.trim()}})};
}
export async function r2Url(path:string,method:'GET'|'PUT'='GET'){
 const {client,bucket}=config(),Key=documentKey(path);
 const command=method==='GET'?new GetObjectCommand({Bucket:bucket,Key}):new PutObjectCommand({Bucket:bucket,Key,ContentType:'application/pdf'});
 return getSignedUrl(client,command,{expiresIn:method==='GET'?3600:900});
}
export async function r2Delete(path:string){const {client,bucket}=config();await client.send(new DeleteObjectCommand({Bucket:bucket,Key:documentKey(path)}),{abortSignal:AbortSignal.timeout(20000)});}
export async function r2Check(){const {client,bucket}=config();await client.send(new HeadBucketCommand({Bucket:bucket}),{abortSignal:AbortSignal.timeout(15000)});}
export async function r2Put(path:string,bytes:Uint8Array){const {client,bucket}=config();await client.send(new PutObjectCommand({Bucket:bucket,Key:documentKey(path),Body:bytes,ContentType:'application/pdf'}),{abortSignal:AbortSignal.timeout(45000)});}
export async function boundedPdf(response:Response){
 if(!response.ok)throw Error('Không tải được PDF. Kiểm tra kết nối và quyền truy cập kho tệp.');
 if(Number(response.headers.get('content-length'))>MAX_PDF_BYTES){await response.body?.cancel();throw Error('PDF vượt quá 20 MB.');}
 if(!response.body)throw Error('PDF trống.');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_PDF_BYTES){await reader.cancel();throw Error('PDF vượt quá 20 MB.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=Buffer.concat(chunks);
 if(bytes.length<5||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Tệp không phải PDF hợp lệ.');
 return bytes;
}
