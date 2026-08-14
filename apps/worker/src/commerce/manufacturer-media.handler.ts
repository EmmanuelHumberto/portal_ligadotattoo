import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';

const IMAGE_EXT:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif',
};

export class ManufacturerMediaHandler implements JobHandler {
  readonly type='commerce.manufacturer_media';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
    private readonly s3:S3Client,
    private readonly bucket:string,
  ) {}

  async handle():Promise<JobResult>{
    const manufacturers=await this.pool.query(
      `select id,name,official_website from catalog.manufacturer
        where official_website is not null and status='ACTIVE'
          and slug<>'fixture-tattoo-labs'`,
    );
    for(const m of manufacturers.rows){
      try {
        await this.ingestManufacturer(m);
      } catch {
        // seguir para o próximo fabricante
      }
    }
    return 'DONE';
  }

  private async ingestManufacturer(m:any):Promise<void>{
    const existing=await this.pool.query(
      `select 1 from media.media_link ml
        join catalog.product_model p on p.id=ml.subject_id
       where p.manufacturer_id=$1 and ml.subject_type='PRODUCT_MODEL'
       limit 1`,
      [m.id],
    );
    if(existing.rowCount)return;

    const homepage=await this.http.acquire({
      url:String(m.official_website),allowedHosts:[],maxBytes:5_000_000,
    });
    const extracted=await this.extractor.extract({
      contentType:homepage.contentType,body:homepage.body,url:homepage.finalUrl,
    });
    const structured=(extracted.structured ?? {}) as Record<string,unknown>;
    const candidates=[structured.ogImage,
      ...(Array.isArray(structured.images)?structured.images:[]),
    ].filter(Boolean) as string[];

    let mediaId:any=null;
    for(const candidate of candidates){
      mediaId=await this.downloadImage(String(candidate),String(m.name));
      if(mediaId)break;
    }
    if(!mediaId)return;

    const models=await this.pool.query(
      `select id from catalog.product_model where manufacturer_id=$1`,[m.id],
    );
    for(const p of models.rows){
      await this.pool.query(
        `insert into media.media_link
         (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
         select gen_random_uuid(),$1,'PRODUCT_MODEL',$2,'hero',true,0
          where not exists (
            select 1 from media.media_link
             where media_asset_id=$1 and subject_type='PRODUCT_MODEL'
               and subject_id=$2
          )`,
        [mediaId,p.id],
      );
    }
  }

  private async downloadImage(url:string,attribution:string):Promise<string|null>{
    try {
      const img=await this.http.acquire({
        url,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
      });
      const mime=img.contentType ?? 'image/jpeg';
      if(!mime.startsWith('image/'))return null;
      const ext=IMAGE_EXT[mime] ?? 'jpg';
      const id=randomUUID();
      const key=`manufacturers/${id}.${ext}`;
      const sha=createHash('sha256').update(img.body).digest('hex');
      await this.s3.send(new PutObjectCommand({
        Bucket:this.bucket,Key:key,Body:img.body,
        ContentType:mime,ContentLength:img.body.byteLength,
      }));
      await this.pool.query(
        `insert into media.media_asset
         (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,
          status,version,origin_type,attribution)
         values ($1,'IMAGE',$2,$3,$4,$5,'PERMITTED','ACTIVE',1,
                 'MANUFACTURER_WEBSITE',$6)`,
        [id,key,mime,img.body.byteLength,sha,attribution],
      );
      await this.pool.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,is_current,decided_by,decided_at)
         values (gen_random_uuid(),$1,'PERMITTED','MANUFACTURER_PUBLIC_IMAGE',
                 true,'system',now())`,
        [id],
      );
      return id;
    } catch {
      return null;
    }
  }
}
