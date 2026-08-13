import sharp from 'sharp';
import {describe,expect,it} from 'vitest';
import {
  createImageProcessor,SharpImageProcessor,type VariantObjectStore,
  variantStorageKey,
} from '../../apps/worker/src/media/s3-image-processor';

describe('SharpImageProcessor',()=>{
 it('creates deterministic WebP variants without enlarging the source',async()=>{
  const source=await sharp({
   create:{width:1600,height:900,channels:3,background:'#336699'},
  }).png().toBuffer();
  const objects=new Map<string,Buffer>([['originals/source.png',source]]);
  const store:VariantObjectStore={
   async get(key){
    const value=objects.get(key);
    if(!value)throw new Error('missing object');
    return value;
   },
   async put(input){objects.set(input.key,input.body);},
  };
  const result=await new SharpImageProcessor(store).createVariants({
   storageKey:'originals/source.png',mimeType:'image/png',
  });

  expect(result.map(item=>[item.key,item.width,item.height])).toEqual([
   ['thumb',320,180],['card',640,360],['hero',1280,720],
  ]);
  for(const variant of result) {
   expect(variant.storageKey).toBe(
    variantStorageKey('originals/source.png',variant.key),
   );
   const metadata=await sharp(objects.get(variant.storageKey)).metadata();
   expect(metadata.format).toBe('webp');
  }
 });

 it('uses stable keys for safe retries',()=>{
  const first=variantStorageKey('originals/a.png','card');
  expect(variantStorageKey('originals/a.png','card')).toBe(first);
  expect(variantStorageKey('originals/b.png','card')).not.toBe(first);
 });

 it('rejects partial object storage configuration',()=>{
  expect(()=>createImageProcessor({
   OBJECT_STORAGE_ENDPOINT:'https://storage.example.test',
  })).toThrow('OBJECT_STORAGE_BUCKET');
 });
});
