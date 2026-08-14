import { Body,Controller,Get,Post,Query } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Actor } from '../iam/actor.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { TransactionManager } from '../platform/transaction-manager';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { Source } from './source.domain';
import { SourceRepository } from './source.repository';
import { IngestionQuery } from './ingestion.query';

@Controller('admin')
export class IngestionController {
  constructor(
    private readonly txm:TransactionManager,
    private readonly sourcesRepo:SourceRepository,
    private readonly query:IngestionQuery,
    private readonly audit:PostgresAuditRepository,
  ) {}

  @Get('sources')
  @RequireCapability('source.read')
  sources(){ return this.query.sources(); }

  @Post('sources')
  @RequireCapability('source.write')
  createSource(@Body() body:any,@Actor() actor:any) {
    return this.txm.run(async tx => {
      const source=Source.create({id:randomUUID(),...body});
      await this.sourcesRepo.insert(source,tx);
      await this.audit.append({
        actorId:actor.actorId,action:'source.created',
        subjectType:'Source',subjectId:source.id,
      },tx);
      return source;
    });
  }

  @Get('ingestion/runs')
  @RequireCapability('ingestion.read')
  runs(@Query('sourceId') sourceId?:string,@Query('status') status?:string) {
    return this.query.runs({sourceId,status});
  }

  @Get('ingestion/discoveries')
  @RequireCapability('ingestion.read')
  discoveries(@Query('status') status='NEW') {
    return this.query.discoveries(status);
  }

  @Get('crawl-targets')
  @RequireCapability('source.read')
  targets(){ return this.query.targets(); }

  @Post('crawl-targets')
  @RequireCapability('source.write')
  createTarget(@Body() body:any,@Actor() actor:any) {
    return this.txm.run(async tx => {
      const id=randomUUID();
      await tx.query(
        `insert into ingestion.crawl_target
         (id,source_id,url,discovery_mode,schedule_key,max_bytes,status)
         values ($1,$2,$3,$4,$5,$6,'ACTIVE')`,
        [id, body.sourceId, body.url,
         body.discoveryMode ?? 'EDITORIAL',
         body.scheduleKey ?? null,
         body.maxBytes ?? 5000000],
      );
      await this.audit.append({
        actorId:actor.actorId,action:'crawl_target.created',
        subjectType:'CrawlTarget',subjectId:id,
      },tx);
      return {id};
    });
  }
}
