import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class ReadinessService {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async readiness() {
    const checks:any[]=[];
    try {
      const started=Date.now();
      await this.pool.query('select 1');
      checks.push({name:'database',status:'UP',latencyMs:Date.now()-started});
    } catch {
      checks.push({name:'database',status:'DOWN'});
    }

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
