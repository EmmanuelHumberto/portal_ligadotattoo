import {HeadObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import sharp from 'sharp';
import {afterAll,describe,expect,it} from 'vitest';
import {MediaRepository} from '../../apps/api/src/media/media.repository';
import {PublicMediaQuery} from '../../apps/api/src/media/public-media.query';
import {createMediaDelivery} from '../../apps/api/src/media/s3-media-delivery.adapter';
import {S3MediaStorage} from '../../apps/api/src/media/s3-media-storage.adapter';
import {UploadMediaHandler} from '../../apps/api/src/media/upload-media.handler';
import {PostgresAuditRepository} from '../../apps/api/src/platform/audit.repository';
import {OutboxRepository} from '../../apps/api/src/platform/outbox.repository';
import {TransactionManager} from '../../apps/api/src/platform/transaction-manager';
import {createRuntimeProcessors,ProcessorRegistry} from '../../apps/worker/src/processors';

const databaseUrl=process.env.TEST_DATABASE_URL;
const endpoint=process.env.TEST_OBJECT_STORAGE_ENDPOINT;
const integration=databaseUrl&&endpoint ? describe : describe.skip;

integration('media upload',()=>{
 const pool=new Pool({connectionString:databaseUrl});
 const bucket='portal-media-test';
 const accessKey=process.env.TEST_OBJECT_STORAGE_ACCESS_KEY||'portal_dev';
 const secretKey=process.env.TEST_OBJECT_STORAGE_SECRET_KEY||'portal_dev_secret';
 const config={
  bucket,endpoint,accessKey,secretKey,region:'us-east-1',
  forcePathStyle:true,autoCreateBucket:true,
 };
 const storage=new S3MediaStorage(config);
 const handler=new UploadMediaHandler(
  storage,new TransactionManager(pool),new MediaRepository(),
  new PostgresAuditRepository(),new OutboxRepository(),
 );
 const s3=new S3Client({
  endpoint,region:'us-east-1',forcePathStyle:true,
  credentials:{accessKeyId:accessKey,secretAccessKey:secretKey},
 });
 let assetId:string|undefined;
 let storageKey:string|undefined;
 let eventId:string|undefined;
 const variantKeys:string[]=[];
 const subjectId=randomUUID();

 afterAll(async()=>{
  if(assetId) {
   await pool.query('delete from media.media_link where media_asset_id=$1',[assetId]);
   await pool.query('delete from media.media_rights where media_asset_id=$1',[assetId]);
   await pool.query(
    `delete from ops.audit_log
      where subject_type='MediaAsset' and subject_id=$1`,[assetId],
   );
   if(eventId)await pool.query('delete from ops.job where source_event_id=$1',[eventId]);
   await pool.query(
    `delete from ops.outbox_event
      where aggregate_type='MediaAsset' and aggregate_id=$1`,[assetId],
   );
   await pool.query('delete from media.media_asset where id=$1',[assetId]);
  }
  if(storageKey)await storage.delete(storageKey);
  for(const key of variantKeys)await storage.delete(key);
  await pool.end();
 });

 it('stores validated bytes and commits matching metadata',async()=>{
  const png=await sharp({
   create:{width:1600,height:900,channels:3,background:'#663399'},
  }).png().toBuffer();
  const result=await handler.execute({
   buffer:png,size:png.length,mimetype:'image/png',originalname:'ignored.png',
  } as Express.Multer.File,'integration-admin');
  assetId=result.id;
  const row=await pool.query(
   'select storage_key,sha256,byte_size from media.media_asset where id=$1',
   [assetId],
  );
  storageKey=row.rows[0]?.storage_key;
  const object=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:storageKey}));
  expect(row.rows[0]?.byte_size).toBe(String(png.length));
  expect(row.rows[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(object.ContentType).toBe('image/png');
  expect(object.Metadata?.sha256).toBe(row.rows[0]?.sha256);
 });

 it('routes the upload and creates three WebP variants',async()=>{
  const outbox=await pool.query(
   `select id,event_type,event_version,aggregate_type,aggregate_id,payload
      from ops.outbox_event
     where aggregate_type='MediaAsset' and aggregate_id=$1`,[assetId],
  );
  const row=outbox.rows[0];
  eventId=row.id;
  const registry=new ProcessorRegistry(createRuntimeProcessors(pool,{
   OBJECT_STORAGE_BUCKET:bucket,OBJECT_STORAGE_ENDPOINT:endpoint,
   OBJECT_STORAGE_REGION:'us-east-1',OBJECT_STORAGE_ACCESS_KEY:accessKey,
   OBJECT_STORAGE_SECRET_KEY:secretKey,OBJECT_STORAGE_FORCE_PATH_STYLE:'true',
  }));
  for(let attempt=0;attempt<4;attempt++)
   await registry.tick({signal:new AbortController().signal});
  const [published,jobs]=await Promise.all([
   pool.query('select status from ops.outbox_event where id=$1',[eventId]),
   pool.query('select status,count(*) over()::int count from ops.job where source_event_id=$1',[eventId]),
  ]);
  expect(published.rows[0]?.status).toBe('PUBLISHED');
  expect(jobs.rows[0]).toMatchObject({status:'DONE',count:1});
  const variants=await pool.query(
   `select variant_key,storage_key,width,height,mime_type
      from media.media_variant where media_asset_id=$1 order by width`,[assetId],
  );
  expect(variants.rows.map(item=>item.variant_key)).toEqual(['thumb','card','hero']);
  for(const variant of variants.rows) {
   variantKeys.push(variant.storage_key);
   const object=await s3.send(new HeadObjectCommand({
    Bucket:bucket,Key:variant.storage_key,
   }));
   expect(variant.mime_type).toBe('image/webp');
   expect(object.ContentType).toBe('image/webp');
   expect(object.Metadata?.derived).toBe('true');
  }
 });

 it('delivers signed private URLs only while rights are valid',async()=>{
  await pool.query(
   `update media.media_asset set rights_status='PERMITTED' where id=$1`,[assetId],
  );
  await pool.query(
   `insert into media.media_link
    (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
    values ($1,$2,'PRODUCT_MODEL',$3,'GALLERY',true,0)`,
   [randomUUID(),assetId,subjectId],
  );
  const delivery=createMediaDelivery({
   OBJECT_STORAGE_BUCKET:bucket,OBJECT_STORAGE_ENDPOINT:endpoint,
   OBJECT_STORAGE_REGION:'us-east-1',OBJECT_STORAGE_ACCESS_KEY:accessKey,
   OBJECT_STORAGE_SECRET_KEY:secretKey,OBJECT_STORAGE_FORCE_PATH_STYLE:'true',
   MEDIA_SIGNED_URL_TTL_SECONDS:'60',
  });
  const query=new PublicMediaQuery(pool,delivery);
  expect((await query.forSubject('PRODUCT_MODEL',subjectId)).items).toEqual([]);
  await pool.query(
   `insert into media.media_rights
    (id,media_asset_id,status,basis,is_current,decided_by,decided_at,expires_at)
    values ($1,$2,'PERMITTED','integration-test',true,'integration-admin',now(),
            now()+interval '1 hour')`,[randomUUID(),assetId],
  );
  const permitted=await query.forSubject('PRODUCT_MODEL',subjectId);
  expect(permitted.items).toHaveLength(1);
  expect(permitted.items[0].variants).toHaveLength(3);
  expect(permitted.items[0].url).toContain('X-Amz-Signature=');
  const response=await fetch(permitted.items[0].variants[0].url);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('image/webp');

  await pool.query(
   `update media.media_rights set expires_at=now()-interval '1 second'
     where media_asset_id=$1 and is_current=true`,[assetId],
  );
  const expired=await query.forSubject('PRODUCT_MODEL',subjectId);
  expect(expired.items).toEqual([]);
 });
});
