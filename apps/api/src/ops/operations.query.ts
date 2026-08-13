import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import { redactOperationalValue } from './redaction';

@Injectable()
export class OperationsQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async jobs(status?:string) {
    const r=await this.pool.query(
      `select id,job_type,job_version,status,attempts,available_at,
              locked_at,last_error,created_at,updated_at
         from ops.job
        where ($1::text is null or status=$1)
        order by created_at desc limit 200`,[status ?? null],
    );
    return {items:r.rows.map(x=>({
      ...x,last_error:redactOperationalValue(x.last_error),
    }))};
  }

  async outbox(status?:string) {
    const r=await this.pool.query(
      `select id,event_type,event_version,aggregate_type,aggregate_id,
              status,attempts,available_at,occurred_at,created_at
         from ops.outbox_event
        where ($1::text is null or status=$1)
        order by created_at desc limit 200`,[status ?? null],
    );
    return {items:r.rows};
  }

  async deadLetters() {
    const r=await this.pool.query(
      `select id,source_type,source_id,kind,error_code,error_summary,
              first_failed_at,last_failed_at,attempt_count,status
         from ops.dead_letter order by last_failed_at desc limit 200`,
    );
    return {items:r.rows};
  }

  async cacheInvalidations() {
    const r=await this.pool.query(
      `select id,cache_key,reason,created_at,processed_at
         from ops.cache_invalidation order by created_at desc limit 200`,
    );
    return {items:r.rows};
  }

  async dashboard() {
    const [jobs,outbox,dead,ai,ingestion,media]=await Promise.all([
      this.pool.query(`select status,count(*)::int count from ops.job group by status`),
      this.pool.query(`select status,count(*)::int count from ops.outbox_event group by status`),
      this.pool.query(`select status,count(*)::int count from ops.dead_letter group by status`),
      this.pool.query(
        `select status,count(*)::int count,
                coalesce(avg(latency_ms),0)::int avg_latency_ms
           from ai.execution where created_at>=now()-interval '24 hours'
          group by status`,
      ),
      this.pool.query(
        `select status,count(*)::int count from ingestion.run
          where started_at>=now()-interval '24 hours' group by status`,
      ),
      this.pool.query(
        `select rights_status,count(*)::int count from media.media_asset
          group by rights_status`,
      ),
    ]);
    return {
      jobs:jobs.rows,outbox:outbox.rows,deadLetters:dead.rows,
      ai24h:ai.rows,ingestion24h:ingestion.rows,mediaRights:media.rows,
      generatedAt:new Date().toISOString(),
    };
  }
}
