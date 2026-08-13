import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';

@Injectable()
export class CanonicalRepository {
  async createProposal(p:any,createdBy:string,tx:Tx) {
    await tx.query(
      `insert into knowledge.canonical_proposal
       (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
        status,created_by,version,created_at)
       values ($1,$2,$3,$4,$5::jsonb,$6::uuid[],'PENDING',$7,1,now())`,
      [p.id,p.subjectType,p.subjectId,p.propertyKey,
       JSON.stringify(p.proposedValue),p.evidenceIds,createdBy],
    );
  }

  async lockProposal(id:string,tx:Tx) {
    const r=await tx.query(
      `select * from knowledge.canonical_proposal where id=$1 for update`,
      [id],
    );
    return r.rows[0] ?? null;
  }

  async closeCurrentFact(
    subjectType:string,subjectId:string,propertyKey:string,validTo:Date,tx:Tx,
  ) {
    await tx.query(
      `update knowledge.canonical_fact
          set valid_to=$4
        where subject_type=$1 and subject_id=$2 and property_key=$3
          and valid_to is null`,
      [subjectType,subjectId,propertyKey,validTo],
    );
  }

  async insertFact(input:any,tx:Tx) {
    const r=await tx.query(
      `insert into knowledge.canonical_fact
       (id,subject_type,subject_id,property_key,value,unit,valid_from,valid_to,
        proposal_id,decided_by,decision_reason,version)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7,null,$8,$9,$10,1)
       returning *`,
      [
        input.id,input.subjectType,input.subjectId,input.propertyKey,
        JSON.stringify(input.value),input.unit ?? null,input.validFrom,
        input.proposalId,input.decidedBy,input.reason,
      ],
    );
    return r.rows[0];
  }
}
