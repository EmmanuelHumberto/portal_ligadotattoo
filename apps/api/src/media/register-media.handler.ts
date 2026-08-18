import {Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {OutboxRepository} from '../platform/outbox.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {RegisterMediaInput} from './admin-media.input';
import {MediaAsset} from './media.domain';
import {MediaRepository} from './media.repository';

@Injectable()
export class RegisterMediaHandler{
  constructor(
    private readonly txm:TransactionManager,
    private readonly media:MediaRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ){}

  execute(input:RegisterMediaInput,actorId:string){
    return this.txm.run(async tx=>{
      const asset=MediaAsset.register({id:randomUUID(),...input});
      await this.media.insert(asset,tx);
      await this.audit.append({actorId,action:'media.registered',
        subjectType:'MediaAsset',subjectId:asset.id},tx);
      await this.outbox.append({id:randomUUID(),type:'media.asset_registered',version:1,
        aggregateType:'MediaAsset',aggregateId:asset.id,occurredAt:new Date(),
        payload:{mimeType:asset.mimeType}},tx);
      return {id:asset.id,kind:asset.kind,mimeType:asset.mimeType,
        rightsStatus:asset.rightsStatus,status:asset.status,version:asset.version};
    });
  }
}
