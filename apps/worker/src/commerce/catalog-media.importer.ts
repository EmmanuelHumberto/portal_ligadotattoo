import {PutObjectCommand,type S3Client} from '@aws-sdk/client-s3';
import {createHash,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {HttpAcquirer} from '../ingestion/http-acquirer';

const IMAGE_EXT:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif',
};

export class CatalogMediaImporter{
  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly s3:S3Client,
    private readonly bucket:string,
    private readonly retryDelay:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,1_200)),
  ){}

  async importPending(url:string,attribution:string):Promise<string|null>{
    try{
      const secureUrl=url.startsWith('http://')?`https://${url.slice(7)}`:url;
      let image;
      try{
        image=await this.acquire(secureUrl);
      }catch{
        await this.retryDelay();
        image=await this.acquire(secureUrl);
      }
      const mime=image.contentType?.split(';')[0]?.trim().toLowerCase()??'image/jpeg';
      if(!mime.startsWith('image/'))return null;
      const id=randomUUID();
      const key=`catalog/${id}.${IMAGE_EXT[mime]??'jpg'}`;
      const sha256=createHash('sha256').update(image.body).digest('hex');
      await this.s3.send(new PutObjectCommand({
        Bucket:this.bucket,Key:key,Body:image.body,ContentType:mime,
        ContentLength:image.body.byteLength,
      }));
      await this.pool.query(
        `insert into media.media_asset
         (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,
          status,version,origin_type,attribution)
         values ($1,'IMAGE',$2,$3,$4,$5,'PENDING','ACTIVE',1,
                 'MANUFACTURER_PRODUCT_PAGE',$6)`,
        [id,key,mime,image.body.byteLength,sha256,attribution],
      );
      await this.pool.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,source_url,is_current,decided_by,decided_at)
         values (gen_random_uuid(),$1,'PENDING','REVIEW_REQUIRED',$2,
                 true,'catalog-discovery',now())`,[id,secureUrl],
      );
      return id;
    }catch{return null;}
  }

  private acquire(url:string){
    return this.http.acquire({
      url,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
    });
  }
}
