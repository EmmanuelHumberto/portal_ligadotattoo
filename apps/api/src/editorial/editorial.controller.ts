import {
  BadRequestException,Body,Controller,Delete,Get,Inject,NotFoundException,Patch,Param,Post,Query,
} from '@nestjs/common';
import { randomUUID,createHash } from 'node:crypto';
import { Pool } from 'pg';
import { Actor } from '../iam/actor.decorator';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { PG_POOL } from '../platform/database.module';
import { CreateEditorialHandler } from './create-editorial.handler';
import { EditorialWorkflowHandler } from './review-publish.handler';
import { EditorialQuery } from './editorial.query';
import { GenerateAIDraftHandler } from './generate-ai-draft.handler';
import { StoryCandidateQuery } from './story-candidate.query';

@Controller()
export class EditorialController {
  constructor(
    private readonly createHandler:CreateEditorialHandler,
    private readonly workflow:EditorialWorkflowHandler,
    private readonly query:EditorialQuery,
    private readonly aiDraft:GenerateAIDraftHandler,
    private readonly candidates:StoryCandidateQuery,
    @Inject(PG_POOL) private readonly pool:Pool,
  ) {}

  @Get('public/editorial')
  @Public()
  listPublic(@Query('type') type?:string) {
    return this.query.publicList(type);
  }

  @Get('public/editorial/:slug')
  @Public()
  async publicDetail(@Param('slug') slug:string) {
    const result=await this.query.publicBySlug(slug);
    if (!result) throw new NotFoundException('Editorial content not found');
    return result;
  }

  @Get('admin/editorial')
  @RequireCapability('editorial.read')
  adminList(@Query('status') status?:string,@Query('type') type?:string) {
    return this.query.adminList(status,type);
  }

  @Get('admin/editorial/candidates')
  @RequireCapability('editorial.read')
  adminCandidates(@Query('status') status?:string) {
    return this.candidates.candidates(status);
  }

  @Get('admin/editorial/:id')
  @RequireCapability('editorial.read')
  async adminDetail(@Param('id') id:string) {
    const result=await this.query.adminById(id);
    if (!result) throw new NotFoundException('Editorial content not found');
    return result;
  }

  @Post('admin/editorial')
  @RequireCapability('editorial.write')
  create(@Body() body:any,@Actor() actor:any) {
    return this.createHandler.execute(body,actor.actorId);
  }

  @Patch('admin/editorial/:id')
  @RequireCapability('editorial.write')
  async update(@Param('id') id:string,@Body() body:any) {
    const title=String(body?.title ?? '').trim();
    if(!title)throw new BadRequestException('Título é obrigatório');
    const r=await this.pool.query(
      `update editorial.content
          set title=$2, subtitle=$3, summary=$4, body_document=$5::jsonb,
              version=version+1, updated_at=now()
        where id=$1 and status='DRAFT'
        returning id,title,subtitle,summary,version`,
      [id, title,
       body.subtitle ?? null,
       body.summary ?? null,
       JSON.stringify(body.body ?? {version:1,blocks:[]})],
    );
    if(!r.rowCount)throw new BadRequestException('Somente rascunhos podem ser editados');
    return r.rows[0];
  }

  @Post('admin/editorial/ingest-social')
  @RequireCapability('editorial.write')
  async ingestSocial(@Body() body:any) {
    const url=String(body?.url ?? '').trim();
    const text=String(body?.text ?? '').trim();
    if(!url && !text)throw new BadRequestException('URL ou texto da postagem são obrigatórios');
    const sourceId=await this.socialSourceId();

    // Fallback manual: se o texto foi colado, cria o candidato direto (sem depender de scraping).
    if(text){
      const title=(text.split(/\n/)[0] ?? '').slice(0,140) || url || 'Postagem de rede social';
      const sha=createHash('sha256').update(text).digest('hex');
      const snapshotId=randomUUID();
      await this.pool.query(
        `insert into ingestion.snapshot
         (id,source_id,url,content_type,http_status,sha256,body_bytes,observed_at)
         values ($1,$2,$3,'text/plain',200,$4,$5,now())`,
        [snapshotId,sourceId,url,sha,Buffer.from(text)],
      );
      await this.pool.query(
        `insert into ingestion.extraction
         (id,snapshot_id,title,text_content,structured_data,fingerprint,created_at)
         values (gen_random_uuid(),$1,$2,$3,'{}'::jsonb,$4,now())`,
        [snapshotId,title,text,sha],
      );
      const candidateId=randomUUID();
      await this.pool.query(
        `insert into editorial.story_candidate
         (id,source_id,source_snapshot_id,source_url,title,detected_type,verbatim,status,created_at)
         values ($1,$2,$3,$4,$5,'BLOG',true,'NEW',now())
         on conflict (source_snapshot_id) do nothing`,
        [candidateId,sourceId,snapshotId,url,title],
      );
      await this.pool.query(
        `insert into ops.job
         (id,job_type,job_version,payload,status,available_at,deduplication_key)
         values (gen_random_uuid(),'editorial.auto_draft',1,$1::jsonb,'PENDING',now(),$2)
         on conflict (job_type,deduplication_key)
           where deduplication_key is not null do nothing`,
        [JSON.stringify({candidateId}),'auto-draft:'+candidateId],
      );
      return {enqueued:1,candidateId,mode:'manual'};
    }

    const r=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       values (gen_random_uuid(),'ingestion.collect_article',1,$1::jsonb,'PENDING',now(),$2)
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
      [JSON.stringify({sourceId,url,requestedType:'BLOG',verbatim:true}),'social-article:'+url],
    );
    return {enqueued:r.rowCount ?? 0,mode:'scrape'};
  }

  private async socialSourceId():Promise<string>{
    const existing=await this.pool.query(
      `select id from ingestion.source where kind='SOCIAL' limit 1`,
    );
    if(existing.rowCount)return existing.rows[0].id;
    const id=randomUUID();
    await this.pool.query(
      `insert into ingestion.source
       (id,name,kind,base_url,allowed_hosts,status)
       values ($1,'Redes sociais','SOCIAL','https://www.instagram.com/','{}','ACTIVE')`,
      [id],
    );
    return id;
  }

  @Post('admin/editorial/:id/submit')
  @RequireCapability('editorial.write')
  submit(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.submit(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/:id/approve')
  @RequireCapability('editorial.approve')
  approve(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.approve(
      id,body.expectedVersion,actor.actorId,body.reason,
    );
  }

  @Post('admin/editorial/:id/schedule')
  @RequireCapability('editorial.publish')
  schedule(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.schedule(
      id,body.expectedVersion,actor.actorId,new Date(body.publishAt),
    );
  }

  @Post('admin/editorial/:id/publish')
  @RequireCapability('editorial.publish')
  publish(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.publish(id,body.expectedVersion,actor.actorId);
  }

  @Delete('admin/editorial/:id')
  @RequireCapability('editorial.write')
  remove(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.remove(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/:id/unpublish')
  @RequireCapability('editorial.publish')
  unpublish(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.unpublish(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/ai-draft')
  @RequireCapability('editorial.write')
  ai(@Body() body:any,@Actor() actor:any) {
    return this.aiDraft.execute({...body,actorId:actor.actorId});
  }
}
