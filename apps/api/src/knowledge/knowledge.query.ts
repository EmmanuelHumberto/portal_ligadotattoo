import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class KnowledgeQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async claims(input:{status?:string;subjectId?:string;limit?:number}) {
    const limit=Math.min(Math.max(input.limit ?? 50,1),100);
    const r=await this.pool.query(
      `select id,subject_type,subject_id,property_key,value,claimant_type,
              source_snapshot_id,source_url,observed_at,confidence,status,version
         from knowledge.claim
        where ($1::text is null or status=$1)
          and ($2::uuid is null or subject_id=$2)
        order by observed_at desc
        limit $3`,
      [input.status ?? null,input.subjectId ?? null,limit],
    );
    return {items:r.rows};
  }

  async claimById(id:string) {
    const r=await this.pool.query(
      `select id,subject_type,subject_id,property_key,value,claimant_type,
              claimant_id,source_snapshot_id,source_url,observed_at,
              confidence,status,version,created_at
         from knowledge.claim
        where id=$1`,
      [id],
    );
    return r.rowCount ? r.rows[0] : null;
  }

  async proposals(status='PENDING',limit=50) {
    const r=await this.pool.query(
      `select id,subject_type,subject_id,property_key,proposed_value,
              evidence_ids,status,created_by,created_at,version
         from knowledge.canonical_proposal
        where status=$1
        order by created_at
        limit $2`,
      [status,Math.min(Math.max(limit,1),100)],
    );
    return {items:r.rows};
  }

  async proposal(id:string) {
    const p=await this.pool.query(
      `select * from knowledge.canonical_proposal where id=$1`,
      [id],
    );
    if (!p.rowCount) return null;
    const row=p.rows[0];
    const evidence=await this.pool.query(
      `select id,subject_type,subject_id,property_key,value,claimant_type,
              source_snapshot_id,source_url,observed_at,confidence,status
         from knowledge.claim where id=any($1::uuid[])`,
      [row.evidence_ids],
    );
    const current=await this.pool.query(
      `select * from knowledge.canonical_fact
        where subject_type=$1 and subject_id=$2 and property_key=$3
          and valid_to is null`,
      [row.subject_type,row.subject_id,row.property_key],
    );
    return {...row,evidence:evidence.rows,currentFact:current.rows[0] ?? null};
  }
}
