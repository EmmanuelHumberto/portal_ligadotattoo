const MAX_IMAGE=20*1024*1024;
const MAX_DOCUMENT=25*1024*1024;
const ALLOWED=new Set([
 'image/jpeg','image/png','image/webp','image/avif','application/pdf',
]);

export function validateUpload(input:{
 mimeType:string;byteSize:number;head:Buffer;
}){
 if(!ALLOWED.has(input.mimeType))throw new Error('UPLOAD_TYPE_NOT_ALLOWED');
 const max=input.mimeType==='application/pdf'?MAX_DOCUMENT:MAX_IMAGE;
 if(input.byteSize<=0||input.byteSize>max)throw new Error('UPLOAD_SIZE_INVALID');

 const h=input.head;
 const jpeg=h[0]===0xff&&h[1]===0xd8&&h[2]===0xff;
 const png=h.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp=h.subarray(0,4).toString()==='RIFF'&&h.subarray(8,12).toString()==='WEBP';
 const pdf=h.subarray(0,5).toString()==='%PDF-';
 const avif=h.length>=12&&h.subarray(4,8).toString()==='ftyp'&&
  /avif|avis/.test(h.subarray(8,16).toString());

 const ok=input.mimeType==='image/jpeg'?jpeg:
  input.mimeType==='image/png'?png:
  input.mimeType==='image/webp'?webp:
  input.mimeType==='image/avif'?avif:pdf;
 if(!ok)throw new Error('UPLOAD_SIGNATURE_MISMATCH');
 return true;
}
