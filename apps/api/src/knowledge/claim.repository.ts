import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { Claim } from './claim.domain';

@Injectable()
export class ClaimRepository {
  async insert(c:Claim,tx:Tx) {
    await tx.query(
      `insert into knowledge.claim
       (id,subject_type,subject_id,property_key,value,claimant_type,claimant_id,
        source_snapshot_id,source_url,observed_at,confidence,status,version)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        c.id,c.subjectType,c.subjectId,c.propertyKey,JSON.stringify(c.value),
        c.claimantType,c.claimantId,c.sourceSnapshotId,c.sourceUrl,
        c.observedAt,c.confidence,c.status,c.version,
      ],
    );
  }

  async activeForProperty(
    subjectType:string,subjectId:string,propertyKey:string,tx:Tx,
  ) {
    return (await tx.query(
      `select * from knowledge.claim
        where subject_type=$1 and subject_id=$2 and property_key=$3
          and status in ('ACTIVE','DISPUTED')
        order by observed_at desc,id`,
      [subjectType,subjectId,propertyKey],
    )).rows;
  }
}
