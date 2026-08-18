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
    const bounded=Math.min(Math.max(limit,1),200);
    const [r,a,b]=await Promise.all([this.pool.query(
      `select id,workload_key,provider_key,model_key,status,
              input_tokens,output_tokens,estimated_cost_usd,latency_ms,
              attempt_count,error_code,correlation_id,created_at
         from ai.execution order by created_at desc limit $1`,
      [bounded],
    ),this.pool.query(
      `select a.id,a.execution_id,a.attempt_no,a.provider_key,a.model_key,a.status,
              a.estimated_input_tokens,a.reserved_cost_usd,a.input_tokens,
              a.output_tokens,a.estimated_cost_usd,a.latency_ms,
              a.provider_request_id,a.error_code,a.created_at,a.finished_at
         from ai.execution_attempt a
         join (select id from ai.execution order by created_at desc limit $1) e
           on e.id=a.execution_id
        order by a.created_at desc`,[bounded],
    ),this.pool.query(
      `select w.workload_key,
              coalesce(sum(coalesce(a.estimated_cost_usd,a.reserved_cost_usd))
                filter(where a.created_at>=date_trunc('day',now())),0) day_cost_usd,
              coalesce(sum(coalesce(a.estimated_cost_usd,a.reserved_cost_usd))
                filter(where a.created_at>=date_trunc('month',now())),0) month_cost_usd,
              max(w.daily_budget_usd) daily_budget_usd,
              max(w.monthly_budget_usd) monthly_budget_usd
         from ai.workload_policy w
         left join ai.execution e on e.workload_key=w.workload_key
         left join ai.execution_attempt a on a.execution_id=e.id
        group by w.workload_key order by w.workload_key`,
    )]);
    return {items:r.rows,attempts:a.rows,budgets:b.rows};
  }

  async registry() {
    const [p,m,w]=await Promise.all([
      this.pool.query(`select provider_key,label,enabled from ai.provider order by label`),
      this.pool.query(
        `select key,provider_key,provider_model_id,label,enabled,
                max_input_tokens,max_output_tokens,input_cost_per_million,
                output_cost_per_million
           from ai.model order by provider_key,label`,
      ),
      this.pool.query(
        `select workload_key,enabled,timeout_ms,max_attempts,
                max_output_tokens,max_estimated_cost_usd,daily_budget_usd,
                monthly_budget_usd
           from ai.workload_policy order by workload_key`,
      ),
    ]);
    return {providers:p.rows,models:m.rows,workloads:w.rows};
  }
}
