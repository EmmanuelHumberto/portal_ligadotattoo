import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class IngestionQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async sources(limit=100) {
    const r=await this.pool.query(
      `select id,name,kind,base_url,allowed_hosts,robots_policy,
              crawl_delay_ms,status,version,created_at,updated_at
         from ingestion.source order by name limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }

  async runs(input:{sourceId?:string;status?:string;limit?:number}) {
    const r=await this.pool.query(
      `select r.id,r.source_id,s.name source_name,r.target_id,r.status,
              r.started_at,r.finished_at,r.snapshot_id,r.deduplicated,
              r.error_code,r.error_message
         from ingestion.run r join ingestion.source s on s.id=r.source_id
        where ($1::uuid is null or r.source_id=$1)
          and ($2::text is null or r.status=$2)
        order by r.started_at desc limit $3`,
      [input.sourceId ?? null,input.status ?? null,
       Math.min(Math.max(input.limit ?? 50,1),200)],
    );
    return {items:r.rows};
  }

  async discoveries(status='NEW') {
    const r=await this.pool.query(
      `select * from ingestion.discovery_candidate
        where status=$1 order by created_at desc limit 100`,
      [status],
    );
    return {items:r.rows};
  }
}
