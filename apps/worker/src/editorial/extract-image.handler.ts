import { Pool } from 'pg';
import { randomUUID, createHash } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';

const IMAGE_EXT:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp',
  'image/gif':'gif','image/avif':'avif',
};

export class ExtractImageHandler implements JobHandler {
  readonly type='editorial.extract_image';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
    private readonly s3:S3Client,
    private readonly bucket:string,
  ) {}

  async handle(payload:unknown):Promise<JobResult>{
    const p=(payload ?? {}) as Record<string,unknown>;
    const candidateId=String(p.candidateId ?? '');
    if(!candidateId)return 'NON_RETRYABLE';

    try{
      let imageUrl=String(p.imageUrl ?? '').trim();
      // Sem URL de imagem manual, tenta extrair a og:image da URL da postagem.
      if(!imageUrl){
        const url=String(p.url ?? '').trim();
        if(!url)return 'DONE';
        const r=await this.http.acquire({url,allowedHosts:[],maxBytes:5_000_000});
        const extracted=await this.extractor.extract({
          contentType:r.contentType,body:r.body,url:r.finalUrl,
        });
        const structured=(extracted.structured ?? {}) as Record<string,unknown>;
        imageUrl=String(structured.ogImage ?? '');
      }
      if(!imageUrl)return 'DONE';

      const secureUrl=imageUrl.startsWith('http://') ? 'https://'+imageUrl.slice(7) : imageUrl;
      const img=await this.http.acquire({
        url:secureUrl,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
      });
      const mime=img.contentType ?? 'image/jpeg';
      if(!mime.startsWith('image/'))return 'DONE';

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
      await this.pool.query(
        `update editorial.story_candidate set image_media_id=$1 where id=$2`,
        [id,candidateId],
      );
      return 'DONE';
    } catch(e){
      console.error('extract_image_error',{candidateId,error:(e as Error).message});
      return 'RETRYABLE';
    }
  }
}
