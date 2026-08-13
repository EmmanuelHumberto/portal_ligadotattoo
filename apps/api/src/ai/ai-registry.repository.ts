import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class AIRegistryRepository {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async policy(workloadKey:string) {
    const p=await this.pool.query(
      `select * from ai.workload_policy
        where workload_key=$1 and enabled=true`,[workloadKey],
    );
    if (!p.rowCount) return null;
    const routes=await this.pool.query(
      `select r.priority,m.*,p.provider_key
         from ai.workload_route r
         join ai.model m on m.key=r.model_key
         join ai.provider p on p.provider_key=m.provider_key
        where r.workload_key=$1 and r.enabled=true
          and m.enabled=true and p.enabled=true
        order by r.priority`,
      [workloadKey],
    );
    return {...p.rows[0],routes:routes.rows};
  }

  async executions(limit=100) {
    const r=await this.pool.query(
      `select id,workload_key,provider_key,model_key,status,
              input_tokens,output_tokens,estimated_cost_usd,latency_ms,
              attempt_count,error_code,correlation_id,created_at
         from ai.execution order by created_at desc limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }

  async registry() {
    const [p,m,w]=await Promise.all([
      this.pool.query(`select provider_key,label,enabled from ai.provider order by label`),
      this.pool.query(
        `select key,provider_key,provider_model_id,label,enabled,
                max_input_tokens,max_output_tokens
           from ai.model order by provider_key,label`,
      ),
      this.pool.query(
        `select workload_key,enabled,timeout_ms,max_attempts,
                max_output_tokens,max_estimated_cost_usd
           from ai.workload_policy order by workload_key`,
      ),
    ]);
    return {providers:p.rows,models:m.rows,workloads:w.rows};
  }
}
