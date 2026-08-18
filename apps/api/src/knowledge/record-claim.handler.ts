import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { OutboxRepository } from '../platform/outbox.repository';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { Claim } from './claim.domain';
import { ClaimRepository } from './claim.repository';
import type {ClaimInput} from './admin-knowledge.input';

@Injectable()
export class RecordClaimHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly claims:ClaimRepository,
    private readonly outbox:OutboxRepository,
    private readonly audit:PostgresAuditRepository,
  ) {}

  execute(input:ClaimInput,actorId?:string) {
    return this.txm.run(async tx => {
      const claim=Claim.record({ id:randomUUID(), ...input });
      await this.claims.insert(claim,tx);

      const peers=await this.claims.activeForProperty(
        claim.subjectType,claim.subjectId,claim.propertyKey,tx,
      );
      const conflict=peers.some(x =>
        x.id !== claim.id &&
        JSON.stringify(x.value) !== JSON.stringify(claim.value)
      );

      if (conflict) {
        await tx.query(
          `insert into knowledge.claim_conflict
           (id,subject_type,subject_id,property_key,status,created_at)
           values (gen_random_uuid(),$1,$2,$3,'OPEN',now())
           on conflict (subject_type,subject_id,property_key)
           where status='OPEN' do nothing`,
          [claim.subjectType,claim.subjectId,claim.propertyKey],
        );
      }

      await this.audit.append({
        actorId,action:'claim.recorded',subjectType:'Claim',
        subjectId:claim.id,metadata:{ conflict },
      },tx);

      await this.outbox.append({
        id:randomUUID(),type:'knowledge.claim_recorded',version:1,
        aggregateType:'Claim',aggregateId:claim.id,occurredAt:new Date(),
        payload:{
          subjectType:claim.subjectType,subjectId:claim.subjectId,
          propertyKey:claim.propertyKey,conflict,
        },
      },tx);

      return { claim, conflict };
    });
  }
}
