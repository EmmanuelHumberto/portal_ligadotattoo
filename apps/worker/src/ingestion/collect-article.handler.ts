import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import type { ContentExtractor } from '../ingestion/extraction.handler';

const IMAGE_EXT:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif',
};

export class CollectArticleHandler implements JobHandler {
  readonly type='ingestion.collect_article';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:ContentExtractor,
    private readonly s3:S3Client,
    private readonly bucket:string,
    private readonly autoCreateBucket=false,
  ) {}

  private bucketEnsured=false;

  private async ensureBucket(){
    if(this.bucketEnsured||!this.bucket||!this.autoCreateBucket)return;
    try {
      await this.s3.send(new HeadBucketCommand({Bucket:this.bucket}));
    } catch {
      await this.s3.send(new CreateBucketCommand({Bucket:this.bucket}));
    }
    this.bucketEnsured=true;
  }

  async handle(payload:unknown):Promise<JobResult>{
    const p=payload as Record<string,unknown>|null;
    const url=String(p?.url ?? '');
    const sourceId=String(p?.sourceId ?? '');
    if(!url||!sourceId)return 'NON_RETRYABLE';

    try {
      const src=await this.pool.query(
        `select allowed_hosts from ingestion.source where id=$1`,[sourceId],
      );
      const allowedHosts=(src.rows[0]?.allowed_hosts as string[]) ?? [];

      const result=await this.http.acquire({url,allowedHosts,maxBytes:5_000_000});
      const sha=createHash('sha256').update(result.body).digest('hex');

      // Dedup: se a postagem é a mesma (mesmo sha256), não faz nada.
      const prior=await this.pool.query(
        `select id from ingestion.snapshot where source_id=$1 and sha256=$2 limit 1`,
        [sourceId,sha],
      );
      if(prior.rowCount)return 'DONE';

      const snapshotId=randomUUID();
      await this.pool.query(
        `insert into ingestion.snapshot
         (id,source_id,url,content_type,http_status,sha256,body_bytes,observed_at)
         values ($1,$2,$3,$4,$5,$6,$7,now())`,
        [snapshotId,sourceId,result.finalUrl,result.contentType,
         result.status,sha,result.body],
      );

      const extracted=await this.extractor.extract({
        contentType:result.contentType,body:result.body,url:result.finalUrl,
      });
      const fingerprint=createHash('sha256')
        .update(extracted.text.trim().replace(/\s+/g,' ')).digest('hex');

      await this.pool.query(
        `insert into ingestion.extraction
         (id,snapshot_id,title,text_content,structured_data,fingerprint,created_at)
         values (gen_random_uuid(),$1,$2,$3,$4::jsonb,$5,now())
         on conflict (snapshot_id) do nothing`,
        [snapshotId,extracted.title ?? null,extracted.text,
         JSON.stringify(extracted.structured ?? {}),fingerprint],
      );

      const candidateId=randomUUID();
      await this.pool.query(
        `insert into editorial.story_candidate
         (id,source_id,source_snapshot_id,source_url,title,status,created_at)
         values ($1,$2,$3,$4,$5,'NEW',now())
         on conflict (source_snapshot_id) do nothing`,
        [candidateId,sourceId,snapshotId,result.finalUrl,
         extracted.title ?? result.finalUrl],
      );

      const structured=(extracted.structured ?? {}) as Record<string,unknown>;
      const candidates=[structured.ogImage,...(Array.isArray(structured.images)?structured.images:[])]
        .filter(Boolean) as string[];
      let mediaId:any=null;
      for(const candidate of candidates){
        await this.ensureBucket();
        mediaId=await this.ingestImage(String(candidate));
        if(mediaId)break;
      }
      if(mediaId){
        await this.pool.query(
          `update editorial.story_candidate set image_media_id=$1 where id=$2`,
          [mediaId,candidateId],
        );
      }

      return 'DONE';
    } catch {
      return 'RETRYABLE';
    }
  }

  private async ingestImage(url:string):Promise<string|null>{
    try {
      const img=await this.http.acquire({
        url,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
      });
      const mime=img.contentType ?? 'image/jpeg';
      if(!mime.startsWith('image/'))return null;
      const ext=IMAGE_EXT[mime] ?? 'jpg';
      const id=randomUUID();
      const now=new Date();
      const key=`originals/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,'0')}/${id}.${ext}`;
      const sha=createHash('sha256').update(img.body).digest('hex');
      await this.s3.send(new PutObjectCommand({
        Bucket:this.bucket,Key:key,Body:img.body,
        ContentType:mime,ContentLength:img.body.byteLength,
      }));
      await this.pool.query(
        `insert into media.media_asset
         (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,status,version)
         values ($1,'IMAGE',$2,$3,$4,$5,'PERMITTED','ACTIVE',1)`,
        [id,key,mime,img.body.byteLength,sha],
      );
      return id;
    } catch {
      return null;
    }
  }
}
