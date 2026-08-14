import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class PipelineConfigRepository {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async getAutoDraftEnabled():Promise<boolean> {
    const r=await this.pool.query(
      `select value from editorial.pipeline_setting where key='auto_draft_enabled'`,
    );
    return r.rowCount ? r.rows[0].value==='true' : true;
  }

  async setAutoDraftEnabled(enabled:boolean):Promise<boolean> {
    await this.pool.query(
      `insert into editorial.pipeline_setting(key, value, updated_at)
       values ('auto_draft_enabled', $1, now())
       on conflict (key) do update set value=excluded.value, updated_at=now()`,
      [enabled?'true':'false'],
    );
    return enabled;
  }
}
