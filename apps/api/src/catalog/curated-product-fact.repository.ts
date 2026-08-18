import {Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Tx} from '../platform/transaction-manager';
import type {ProductFactInput} from './admin-product.input';

@Injectable()
export class CuratedProductFactRepository {
  async replace(productId:string,fact:ProductFactInput,actorId:string,tx:Tx){
    const now=new Date();
    await tx.query(
      `update knowledge.canonical_fact
          set valid_to=greatest($3,valid_from+interval '1 microsecond')
        where subject_type='PRODUCT_MODEL' and subject_id=$1
          and property_key=$2 and valid_to is null`,
      [productId,fact.key,now],
    );
    const claimId=randomUUID();
    const proposalId=randomUUID();
    await tx.query(
      `insert into knowledge.claim
       (id,subject_type,subject_id,property_key,value,claimant_type,
        observed_at,confidence,status,version,created_at)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,'CURATOR',now(),1,
        'ACTIVE',1,now())`,
      [claimId,productId,fact.key,JSON.stringify(fact.value)],
    );
    await tx.query(
      `insert into knowledge.canonical_proposal
       (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
        status,created_by,created_at,decided_by,decided_at,decision_reason,version)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,ARRAY[$5]::uuid[],'APPROVED',
        $6,now(),$6,now(),'CURATOR_MANUAL',1)`,
      [proposalId,productId,fact.key,JSON.stringify(fact.value),claimId,actorId],
    );
    await tx.query(
      `insert into knowledge.canonical_fact
       (id,subject_type,subject_id,property_key,value,unit,valid_from,
        proposal_id,decided_by,decision_reason,version)
       values (gen_random_uuid(),'PRODUCT_MODEL',$1,$2,$3::jsonb,$4,$5,$6,$7,
        'CURATOR_MANUAL',1)`,
      [productId,fact.key,JSON.stringify(fact.value),fact.unit,now,proposalId,actorId],
    );
    return {proposalId};
  }
}
