import {Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {SourceInput} from './admin-ingestion.input';
import {Source} from './source.domain';
import {SourceRepository} from './source.repository';

@Injectable()
export class CreateSourceHandler{
  constructor(
    private readonly txm:TransactionManager,
    private readonly sources:SourceRepository,
    private readonly audit:PostgresAuditRepository,
  ){}

  execute(input:SourceInput,actorId:string){
    return this.txm.run(async tx=>{
      const source=Source.create({id:randomUUID(),...input});
      await this.sources.insert(source,tx);
      await this.audit.append({actorId,action:'source.created',
        subjectType:'Source',subjectId:source.id},tx);
      return source;
    });
  }
}
