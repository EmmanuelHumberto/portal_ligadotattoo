import {BadRequestException,Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {CrawlTargetInput} from './admin-ingestion.input';
import {SourceRepository} from './source.repository';

@Injectable()
export class CreateCrawlTargetHandler{
  constructor(
    private readonly txm:TransactionManager,
    private readonly sources:SourceRepository,
    private readonly audit:PostgresAuditRepository,
  ){}

  execute(input:CrawlTargetInput,actorId:string){
    return this.txm.run(async tx=>{
      const source=await this.sources.findActive(input.sourceId,tx);
      if(!source)throw new NotFoundException('Active source not found');
      const targetHost=new URL(input.url).hostname.toLowerCase();
      const allowed=(source.allowed_hosts as unknown[]).map(value=>String(value).toLowerCase());
      if(!allowed.includes(targetHost))
        throw new BadRequestException('Target host is not registered by the source');
      const id=randomUUID();
      await tx.query(
        `insert into ingestion.crawl_target
         (id,source_id,url,discovery_mode,schedule_key,max_bytes,status)
         values ($1,$2,$3,$4,$5,$6,'ACTIVE')`,
        [id,input.sourceId,input.url,input.discoveryMode,input.scheduleKey,input.maxBytes],
      );
      await this.audit.append({actorId,action:'crawl_target.created',
        subjectType:'CrawlTarget',subjectId:id},tx);
      return {id};
    });
  }
}
