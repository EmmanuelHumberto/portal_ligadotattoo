import {describe,expect,it,vi} from 'vitest';
import {
  objectKey,UploadMediaHandler,
} from '../../apps/api/src/media/upload-media.handler';
import {readObjectStorageConfig} from '../../apps/api/src/media/s3-media-storage.adapter';
import {createMediaDelivery} from '../../apps/api/src/media/s3-media-delivery.adapter';
import {validateUpload} from '../../apps/api/src/media/upload-validator';

describe('media upload boundaries',()=>{
 it('accepts matching image signatures and rejects spoofed MIME',()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
  expect(validateUpload({mimeType:'image/png',byteSize:png.length,head:png})).toBe(true);
  expect(()=>validateUpload({
   mimeType:'image/png',byteSize:8,head:Buffer.from('not-png!'),
  })).toThrow('UPLOAD_SIGNATURE_MISMATCH');
 });

 it('generates opaque partitioned object keys',()=>{
  expect(objectKey(
   '00000000-0000-4000-8000-000000000001','image/jpeg',
   new Date('2026-08-12T12:00:00Z'),
  )).toBe('originals/2026/08/00000000-0000-4000-8000-000000000001.jpg');
 });

 it('accepts local MinIO configuration and rejects insecure remote endpoints',()=>{
  expect(readObjectStorageConfig({
   OBJECT_STORAGE_BUCKET:'portal-media',
   OBJECT_STORAGE_ENDPOINT:'http://127.0.0.1:9000',
   OBJECT_STORAGE_ACCESS_KEY:'key',OBJECT_STORAGE_SECRET_KEY:'secret',
  })).toMatchObject({bucket:'portal-media',forcePathStyle:true});
  expect(()=>readObjectStorageConfig({
   OBJECT_STORAGE_BUCKET:'portal-media',
   OBJECT_STORAGE_ENDPOINT:'http://storage.example.test',
  })).toThrow('HTTPS');
 });

 it('deletes the stored object when the database transaction fails',async()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
  const storage={
   put:vi.fn().mockResolvedValue({
    storageKey:'originals/test.png',mimeType:'image/png',
    byteSize:png.length,sha256:'a'.repeat(64),
   }),
   delete:vi.fn().mockResolvedValue(undefined),
  };
  const handler=new UploadMediaHandler(
   storage,
   {run:vi.fn().mockRejectedValue(new Error('database unavailable'))} as any,
   {} as any,{} as any,{} as any,
  );
  await expect(handler.execute({
   buffer:png,size:png.length,mimetype:'image/png',
  } as Express.Multer.File,'admin')).rejects.toThrow('database unavailable');
  expect(storage.delete).toHaveBeenCalledOnce();
 });

 it('creates a SigV4 URL and bounds its lifetime',async()=>{
  const base={
   OBJECT_STORAGE_BUCKET:'portal-media',
   OBJECT_STORAGE_ENDPOINT:'http://127.0.0.1:9000',
   OBJECT_STORAGE_ACCESS_KEY:'key',OBJECT_STORAGE_SECRET_KEY:'secret',
  };
  expect(()=>createMediaDelivery({
   ...base,MEDIA_SIGNED_URL_TTL_SECONDS:'59',
  })).toThrow('MEDIA_SIGNED_URL_TTL_SECONDS');
  expect(()=>createMediaDelivery({
   ...base,MEDIA_SIGNED_URL_TTL_SECONDS:'3601',
  })).toThrow('MEDIA_SIGNED_URL_TTL_SECONDS');
  const signed=await createMediaDelivery({
   ...base,MEDIA_SIGNED_URL_TTL_SECONDS:'120',
  }).url('variants/private/card.webp');
  const url=new URL(signed);
  expect(url.pathname).toBe('/portal-media/variants/private/card.webp');
  expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
  expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
 });
});
