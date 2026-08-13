import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import {DatabaseReadinessService} from '../platform/database-readiness.service';
import {workerHeartbeatStaleSeconds} from '../platform/runtime-config';

@Injectable()
export class ReadinessService {
  constructor(
    @Inject(PG_POOL) private readonly pool:Pool,
    private readonly database:DatabaseReadinessService,
  ){}

  async readiness() {
    const checks:any[]=[];
    const database=await this.database.check();
    checks.push(database);
    if(database.status==='DOWN')
      return {status:'DOWN',checks,checkedAt:new Date().toISOString()};

    checks.push(await this.workerHeartbeat());

    const backlog=await this.safeCount(
      `select count(*)::int count from ops.job
        where status='PENDING' and available_at < now()-interval '15 minutes'`,
    );
    checks.push({
      name:'job_backlog',
      status:backlog===null?'DOWN':backlog>1000?'DEGRADED':'UP',
      pendingOlderThan15m:backlog,
    });

    const outbox=await this.safeCount(
      `select count(*)::int count from ops.outbox_event
        where status='PENDING' and available_at < now()-interval '15 minutes'`,
    );
    checks.push({
      name:'outbox_backlog',
      status:outbox===null?'DOWN':outbox>1000?'DEGRADED':'UP',
      pendingOlderThan15m:outbox,
    });

    const deadJobs=await this.safeCount(
      `select count(*)::int count from ops.job
        where status='DEAD' and completed_at>=now()-interval '1 hour'`,
    );
    checks.push({
      name:'dead_jobs',
      status:deadJobs===null?'DOWN':deadJobs>0?'DEGRADED':'UP',lastHour:deadJobs,
    });

    const status=checks.some(x=>x.status==='DOWN')?'DOWN':
      checks.some(x=>x.status==='DEGRADED')?'DEGRADED':'UP';
    return {status,checks,checkedAt:new Date().toISOString()};
  }

  private async safeCount(sql:string) {
    try {
      const r=await this.pool.query(sql);
      return Number(r.rows[0]?.count ?? 0);
    } catch { return null; }
  }

  private async workerHeartbeat(){
    const staleSeconds=workerHeartbeatStaleSeconds(
      process.env.WORKER_HEARTBEAT_STALE_SECONDS,
    );
    try {
      const result=await this.pool.query(
        `select
          count(*) filter(where status='RUNNING' and
            last_tick_completed_at>=now()-($1::int*interval '1 second'))::int active,
          count(*) filter(where status='STARTING' and
            started_at>=now()-($1::int*interval '1 second'))::int starting,
          count(*) filter(where status in ('RUNNING','STARTING') and
            coalesce(last_tick_completed_at,started_at)<
              now()-($1::int*interval '1 second'))::int stale,
          max(last_tick_completed_at) last_completed_at
         from ops.worker_heartbeat`,[staleSeconds],
      );
      return workerHeartbeatCheck(result.rows[0]??{},staleSeconds);
    } catch {
      return {
        name:'worker_heartbeat',status:'DOWN',reason:'CHECK_UNAVAILABLE',
        staleAfterSeconds:staleSeconds,
      };
    }
  }
}

export function workerHeartbeatCheck(row:any,staleAfterSeconds:number) {
  const active=Number(row.active??0),starting=Number(row.starting??0);
  return {
    name:'worker_heartbeat' as const,
    status:active+starting>0?'UP' as const:'DEGRADED' as const,
    active,starting,stale:Number(row.stale??0),
    lastCompletedAt:row.last_completed_at??null,staleAfterSeconds,
  };
}
