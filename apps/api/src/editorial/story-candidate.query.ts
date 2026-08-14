import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class StoryCandidateQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async candidates(status?:string,limit=100) {
    const r=await this.pool.query(
      `select id,source_id,source_snapshot_id,source_url,title,
              detected_type,relevance_score,status,created_at
         from editorial.story_candidate
        where ($1::text is null or status=$1)
        order by created_at desc limit $2`,
      [status ?? null,Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }

  async candidateSource(id:string) {
    const r=await this.pool.query(
      `select sc.id,sc.title,sc.source_url,sc.source_snapshot_id,
              sc.image_media_id,e.text_content,e.structured_data
         from editorial.story_candidate sc
         left join ingestion.extraction e on e.snapshot_id=sc.source_snapshot_id
        where sc.id=$1`,
      [id],
    );
    return r.rowCount ? r.rows[0] : null;
  }
}
