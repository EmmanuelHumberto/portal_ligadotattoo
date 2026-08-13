import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import {DatabaseReadinessService} from '../platform/database-readiness.service';

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

    const backlog=await this.safeCount(
      `select count(*)::int count from ops.job
        where status='PENDING' and available_at < now()-interval '15 minutes'`,
    );
    checks.push({
      name:'job_backlog',
      status:backlog>1000?'DEGRADED':'UP',
      pendingOlderThan15m:backlog,
    });

    const outbox=await this.safeCount(
      `select count(*)::int count from ops.outbox_event
        where status='PENDING' and available_at < now()-interval '15 minutes'`,
    );
    checks.push({
      name:'outbox_backlog',
      status:outbox>1000?'DEGRADED':'UP',
      pendingOlderThan15m:outbox,
    });

    const deadJobs=await this.safeCount(
      `select count(*)::int count from ops.job
        where status='DEAD' and completed_at>=now()-interval '1 hour'`,
    );
    checks.push({
      name:'dead_jobs',status:deadJobs>0?'DEGRADED':'UP',lastHour:deadJobs,
    });

    const status=checks.some(x=>x.status==='DOWN')?'DOWN':
      checks.some(x=>x.status==='DEGRADED')?'DEGRADED':'UP';
    return {status,checks,checkedAt:new Date().toISOString()};
  }

  private async safeCount(sql:string) {
    try {
      const r=await this.pool.query(sql);
      return Number(r.rows[0]?.count ?? 0);
    } catch { return -1; }
  }
}
