import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class ServiceQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async issues(limit=100) {
    const r=await this.pool.query(
      `select id,title,summary,issue_type,status,severity,
              first_observed_at,validated_at,resolved_at,
              public_visibility,version,created_at,updated_at
         from service.technical_issue
        order by updated_at desc limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }
}
