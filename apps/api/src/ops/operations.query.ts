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
    const [jobs,jobTypes,outbox,dead,ai,ingestion,media,schedule]=await Promise.all([
      this.pool.query(`select status,count(*)::int count from ops.job group by status`),
      this.pool.query(
        `select job_type,status,count(*)::int count,
                coalesce(max(extract(epoch from (now()-created_at))),0)::int
                  oldest_age_seconds
           from ops.job
          where created_at>=now()-interval '24 hours'
          group by job_type,status order by job_type,status`,
      ),
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
      this.pool.query(
        `select
          count(*) filter(where c.status='SCHEDULED' and c.scheduled_at<=now())::int
            editorial_due,
          (select count(*)::int from ingestion.crawl_target t
            join ingestion.source s on s.id=t.source_id
           where t.status='ACTIVE' and s.status='ACTIVE'
             and t.schedule_key in ('5m','15m','1h','6h','24h')) crawl_targets_enabled
         from editorial.content c`,
      ),
    ]);
    return {
      jobs:jobs.rows,jobsByType24h:jobTypes.rows,
      outbox:outbox.rows,deadLetters:dead.rows,
      ai24h:ai.rows,ingestion24h:ingestion.rows,mediaRights:media.rows,
      scheduler:schedule.rows[0],
      generatedAt:new Date().toISOString(),
    };
  }
}
