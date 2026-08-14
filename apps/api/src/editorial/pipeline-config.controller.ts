import { Body, Controller, Get, Inject, Post, Put } from '@nestjs/common';
import { Pool } from 'pg';
import { RequireCapability } from '../iam/require-capability.decorator';
import { PG_POOL } from '../platform/database.module';
import { PipelineConfigRepository } from './pipeline-config.repository';

@Controller('admin/editorial-config')
export class PipelineConfigController {
  constructor(
    private readonly config:PipelineConfigRepository,
    @Inject(PG_POOL) private readonly pool:Pool,
  ) {}

  @Get('auto-draft')
  @RequireCapability('editorial.read')
  async autoDraft() {
    return {enabled: await this.config.getAutoDraftEnabled()};
  }

  @Put('auto-draft')
  @RequireCapability('editorial.write')
  async setAutoDraft(@Body() body:any) {
    return {enabled: await this.config.setAutoDraftEnabled(Boolean(body?.enabled))};
  }

  @Post('auto-draft/run')
  @RequireCapability('editorial.write')
  async runAutoDraft() {
    const r=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'editorial.auto_draft',1,
              jsonb_build_object('candidateId',sc.id),'PENDING',now(),
              'auto-draft:'||sc.id::text
         from editorial.story_candidate sc
        where sc.status in ('NEW','QUALIFIED')
          and not exists (
            select 1 from ops.job j
             where j.job_type='editorial.auto_draft'
               and j.payload->>'candidateId'=sc.id::text
               and j.status in ('PENDING','RUNNING','RETRY')
          )
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return {enqueued:r.rowCount ?? 0};
  }
}
