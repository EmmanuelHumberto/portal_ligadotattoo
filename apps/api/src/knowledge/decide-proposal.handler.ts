import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { OutboxRepository } from '../platform/outbox.repository';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { CanonicalRepository } from './canonical.repository';

@Injectable()
export class DecideCanonicalProposalHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly repository:CanonicalRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  execute(input:{
    proposalId:string;decision:'APPROVE'|'REJECT';
    reason:string;expectedVersion:number;
  },actorId:string) {
    return this.txm.run(async tx => {
      if (!input.reason.trim()) throw new Error('Decision reason is required');
      const p=await this.repository.lockProposal(input.proposalId,tx);
      if (!p) throw Object.assign(new Error('Proposal not found'),{name:'NotFoundError'});
      if (p.status !== 'PENDING' || Number(p.version) !== input.expectedVersion)
        throw Object.assign(new Error('Proposal changed'),{
          name:'ConcurrentModificationError',
        });

      let fact=null;
      const now=new Date();

      if (input.decision === 'APPROVE') {
        await this.repository.closeCurrentFact(
          p.subject_type,p.subject_id,p.property_key,now,tx,
        );
        fact=await this.repository.insertFact({
          id:randomUUID(),subjectType:p.subject_type,subjectId:p.subject_id,
          propertyKey:p.property_key,value:p.proposed_value,
          validFrom:now,proposalId:p.id,decidedBy:actorId,reason:input.reason,
        },tx);
      }

      await tx.query(
        `update knowledge.canonical_proposal
            set status=$2,decision_reason=$3,decided_by=$4,
                decided_at=now(),version=version+1
          where id=$1`,
        [
          p.id,input.decision==='APPROVE'?'APPROVED':'REJECTED',
          input.reason,actorId,
        ],
      );

      if (input.decision === 'APPROVE') {
        await tx.query(
          `update knowledge.claim_conflict
              set status='RESOLVED',resolved_at=now(),resolved_by=$4
            where subject_type=$1 and subject_id=$2 and property_key=$3
              and status='OPEN'`,
          [p.subject_type,p.subject_id,p.property_key,actorId],
        );
      }

      await this.audit.append({
        actorId,action:`canonical.${input.decision.toLowerCase()}`,
        subjectType:'CanonicalProposal',subjectId:p.id,
        reason:input.reason,
        metadata:{ subjectType:p.subject_type,subjectId:p.subject_id,
                   propertyKey:p.property_key },
      },tx);

      await this.outbox.append({
        id:randomUUID(),
        type:input.decision==='APPROVE'
          ? 'knowledge.canonical_fact_changed'
          : 'knowledge.canonical_proposal_rejected',
        version:1,aggregateType:'CanonicalProposal',aggregateId:p.id,
        occurredAt:now,
        payload:{
          subjectType:p.subject_type,subjectId:p.subject_id,
          propertyKey:p.property_key,
        },
      },tx);

      return { proposalId:p.id,decision:input.decision,canonicalFact:fact };
    });
  }
}
