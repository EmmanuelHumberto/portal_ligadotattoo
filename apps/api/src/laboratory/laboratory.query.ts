import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class LaboratoryQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async sessions(limit=100) {
    const r=await this.pool.query(
      `select s.id,s.product_model_id,p.name product_name,
              s.methodology_key,s.methodology_version,s.status,
              s.performed_at,s.performed_by,s.version,
              s.created_at,s.updated_at
         from laboratory.measurement_session s
         join catalog.product_model p on p.id=s.product_model_id
        order by s.updated_at desc limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }
}
