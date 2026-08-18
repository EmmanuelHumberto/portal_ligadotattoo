import {Injectable} from '@nestjs/common';
import {createHash,randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager,type Tx} from '../platform/transaction-manager';
import type {SocialEditorialInput} from './admin-editorial.input';

@Injectable()
export class IngestSocialEditorialHandler{
  constructor(
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
  ){}

  execute(input:SocialEditorialInput,actorId:string){
    return this.txm.run(async tx=>{
      const sourceId=await this.socialSourceId(tx);
      if(input.text)return this.manual(input,sourceId,actorId,tx);
      const result=await tx.query(
        `insert into ops.job
         (id,job_type,job_version,payload,status,available_at,deduplication_key)
         values (gen_random_uuid(),'ingestion.collect_article',1,$1::jsonb,'PENDING',now(),$2)
         on conflict (job_type,deduplication_key)
           where deduplication_key is not null do nothing`,
        [JSON.stringify({sourceId,url:input.url,requestedType:'BLOG',verbatim:true}),
          `social-article:${input.url}`],
      );
      await this.audit.append({
        actorId,action:'editorial.social_ingestion_enqueued',subjectType:'Source',
        subjectId:sourceId,metadata:{url:input.url},
      },tx);
      return {enqueued:result.rowCount??0,mode:'scrape'};
    });
  }

  private async manual(input:SocialEditorialInput,sourceId:string,actorId:string,tx:Tx){
    const title=(input.text.split(/\n/)[0]??'').slice(0,140)
      ||input.url||'Postagem de rede social';
    const fingerprint=createHash('sha256').update(input.text).digest('hex');
    const snapshotId=randomUUID();
    const snapshotSha=createHash('sha256')
      .update(`${input.text}:${snapshotId}`).digest('hex');
    await tx.query(
      `insert into ingestion.snapshot
       (id,source_id,url,content_type,http_status,sha256,body_bytes,observed_at)
       values ($1,$2,$3,'text/plain',200,$4,$5,now())`,
      [snapshotId,sourceId,input.url,snapshotSha,Buffer.from(input.text)],
    );
    await tx.query(
      `insert into ingestion.extraction
       (id,snapshot_id,title,text_content,structured_data,fingerprint,created_at)
       values (gen_random_uuid(),$1,$2,$3,$4::jsonb,$5,now())`,
      [snapshotId,title,input.text,JSON.stringify({mediaIds:input.mediaIds}),fingerprint],
    );
    const candidateId=randomUUID();
    await tx.query(
      `insert into editorial.story_candidate
       (id,source_id,source_snapshot_id,source_url,title,detected_type,verbatim,image_media_id,status,created_at)
       values ($1,$2,$3,$4,$5,'BLOG',true,$6,'NEW',now())`,
      [candidateId,sourceId,snapshotId,input.url,title,input.mediaIds[0]??null],
    );
    await this.enqueue(tx,'editorial.auto_draft',{candidateId},`auto-draft:${candidateId}`);
    if(!input.mediaIds.length)
      await this.enqueue(tx,'editorial.extract_image',
        {candidateId,url:input.url,imageUrl:input.imageUrl},`extract-image:${candidateId}`);
    await this.audit.append({
      actorId,action:'editorial.social_ingested',subjectType:'StoryCandidate',
      subjectId:candidateId,metadata:{url:input.url,mediaCount:input.mediaIds.length},
    },tx);
    return {enqueued:1,candidateId,mode:'manual'};
  }

  private async enqueue(tx:Tx,jobType:string,payload:unknown,deduplicationKey:string){
    await tx.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       values (gen_random_uuid(),$1,1,$2::jsonb,'PENDING',now(),$3)
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
      [jobType,JSON.stringify(payload),deduplicationKey],
    );
  }

  private async socialSourceId(tx:Tx):Promise<string>{
    const existing=await tx.query(`select id from ingestion.source where kind='SOCIAL' limit 1`);
    if(existing.rowCount)return String(existing.rows[0].id);
    const id=randomUUID();
    await tx.query(
      `insert into ingestion.source
       (id,name,kind,base_url,allowed_hosts,status)
       values ($1,'Redes sociais','SOCIAL','https://www.instagram.com/','{}','ACTIVE')`,
      [id],
    );
    return id;
  }
}
