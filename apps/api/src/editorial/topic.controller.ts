import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { Pool } from 'pg';
import { RequireCapability } from '../iam/require-capability.decorator';
import { PG_POOL } from '../platform/database.module';

@Controller('admin/editorial-topics')
export class EditorialTopicController {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  @Get()
  @RequireCapability('editorial.read')
  async list() {
    const r=await this.pool.query(
      `select id,name,query,language,status,max_articles,last_discovered_at,created_at
         from editorial.topic order by name`,
    );
    return {items:r.rows};
  }

  @Post()
  @RequireCapability('editorial.write')
  async create(@Body() body:any) {
    const name=String(body?.name ?? '').trim();
    const query=String(body?.query ?? '').trim();
    if(!name||!query)throw new BadRequestException('Nome e termo de busca são obrigatórios');
    const language=String(body?.language ?? 'pt-BR').trim();
    const maxArticles=Math.min(Math.max(Number(body?.maxArticles ?? 5)||5,1),20);
    const r=await this.pool.query(
      `insert into editorial.topic (name,query,language,max_articles)
       values ($1,$2,$3,$4) returning id,name,query,language,status,max_articles`,
      [name,query,language,maxArticles],
    );
    return r.rows[0];
  }

  @Post('run')
  @RequireCapability('editorial.write')
  async run() {
    const r=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       values (gen_random_uuid(),'editorial.topic_discovery',1,'{}','PENDING',now(),
               'topic:'||to_char(now(),'YYYY-MM-DD HH24:MI'))
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return {enqueued:r.rowCount ?? 0};
  }

  @Put(':id/status')
  @RequireCapability('editorial.write')
  async setStatus(@Param('id') id:string,@Body() body:any) {
    const status=String(body?.status ?? '').trim().toUpperCase();
    if(!['ACTIVE','PAUSED'].includes(status))throw new BadRequestException('Status inválido');
    const r=await this.pool.query(
      `update editorial.topic set status=$2,updated_at=now() where id=$1 returning id,status`,
      [id,status],
    );
    return r.rows[0] ?? {id,status};
  }
}
