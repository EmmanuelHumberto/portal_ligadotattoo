import {HeadObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {Pool} from 'pg';
import {afterAll,describe,expect,it} from 'vitest';
import {MediaRepository} from '../../apps/api/src/media/media.repository';
import {S3MediaStorage} from '../../apps/api/src/media/s3-media-storage.adapter';
import {UploadMediaHandler} from '../../apps/api/src/media/upload-media.handler';
import {PostgresAuditRepository} from '../../apps/api/src/platform/audit.repository';
import {OutboxRepository} from '../../apps/api/src/platform/outbox.repository';
import {TransactionManager} from '../../apps/api/src/platform/transaction-manager';

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

 afterAll(async()=>{
  if(assetId) {
   await pool.query(
    `delete from ops.audit_log
      where subject_type='MediaAsset' and subject_id=$1`,[assetId],
   );
   await pool.query(
    `delete from ops.outbox_event
      where aggregate_type='MediaAsset' and aggregate_id=$1`,[assetId],
   );
   await pool.query('delete from media.media_asset where id=$1',[assetId]);
  }
  if(storageKey)await storage.delete(storageKey);
  await pool.end();
 });

 it('stores validated bytes and commits matching metadata',async()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
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
});
