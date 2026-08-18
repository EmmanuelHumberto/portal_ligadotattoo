import {Inject,Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import type {AIRequest} from './provider-hub.port';
import type {ProviderResponse} from './provider.types';

export type BudgetPolicy={
  max_estimated_cost_usd?:unknown;daily_budget_usd?:unknown;
  monthly_budget_usd?:unknown;
};
export type BudgetRoute={
  key:string;provider_key:string;input_cost_per_million?:unknown;
  output_cost_per_million?:unknown;max_input_tokens?:unknown;
};

@Injectable()
export class AIExecutionLedgerRepository{
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async start(executionId:string,request:AIRequest):Promise<void>{
    await this.pool.query(
      `insert into ai.execution
       (id,workload_key,status,attempt_count,correlation_id,created_at)
       values ($1,$2,'RUNNING',0,$3,now())`,
      [executionId,request.workload,request.correlationId],
    );
  }

  async reserve(input:{
    executionId:string;attemptNo:number;workload:string;route:BudgetRoute;
    policy:BudgetPolicy;estimatedInputTokens:number;maxOutputTokens:number;
  }):Promise<{attemptId:string;reservedCost:number}>{
    assertPriced(input.route);
    const reservedCost=estimateCost(
      input.route,input.estimatedInputTokens,input.maxOutputTokens,
    );
    const perCall=optionalNumber(input.policy.max_estimated_cost_usd);
    if(perCall!=null&&reservedCost>perCall)throw budgetError('AI_CALL_BUDGET_EXCEEDED');
    const client=await this.pool.connect();
    const attemptId=randomUUID();
    try{
      await client.query('begin');
      await client.query(`select pg_advisory_xact_lock(hashtext($1))`,[input.workload]);
      const usage=await client.query(
        `select
           coalesce(sum(coalesce(a.estimated_cost_usd,a.reserved_cost_usd))
             filter(where a.created_at>=date_trunc('day',now())),0) day_cost,
           coalesce(sum(coalesce(a.estimated_cost_usd,a.reserved_cost_usd))
             filter(where a.created_at>=date_trunc('month',now())),0) month_cost
         from ai.execution_attempt a
         join ai.execution e on e.id=a.execution_id
        where e.workload_key=$1`,[input.workload],
      );
      const dayCost=Number(usage.rows[0]?.day_cost??0);
      const monthCost=Number(usage.rows[0]?.month_cost??0);
      const daily=optionalNumber(input.policy.daily_budget_usd);
      const monthly=optionalNumber(input.policy.monthly_budget_usd);
      if(daily!=null&&dayCost+reservedCost>daily)
        throw budgetError('AI_DAILY_BUDGET_EXCEEDED');
      if(monthly!=null&&monthCost+reservedCost>monthly)
        throw budgetError('AI_MONTHLY_BUDGET_EXCEEDED');
      await client.query(
        `insert into ai.execution_attempt
         (id,execution_id,attempt_no,provider_key,model_key,status,
          estimated_input_tokens,reserved_cost_usd,created_at)
         values ($1,$2,$3,$4,$5,'RUNNING',$6,$7,now())`,
        [attemptId,input.executionId,input.attemptNo,input.route.provider_key,
          input.route.key,input.estimatedInputTokens,reservedCost],
      );
      await client.query('commit');
      return {attemptId,reservedCost};
    }catch(error){
      await client.query('rollback');throw error;
    }finally{client.release();}
  }

  async finishAttempt(input:{
    attemptId:string;status:'SUCCEEDED'|'FAILED';started:number;
    route:BudgetRoute;result?:ProviderResponse;error?:unknown;
  }):Promise<void>{
    const cost=input.result?estimateCost(input.route,
      input.result.inputTokens??0,input.result.outputTokens??0):null;
    await this.pool.query(
      `update ai.execution_attempt
          set status=$2,input_tokens=$3,output_tokens=$4,estimated_cost_usd=$5,
              latency_ms=$6,provider_request_id=$7,error_code=$8,finished_at=now()
        where id=$1`,
      [input.attemptId,input.status,input.result?.inputTokens??null,
        input.result?.outputTokens??null,cost,Date.now()-input.started,
        input.result?.providerRequestId??null,errorCode(input.error)],
    );
  }

  async finishExecution(input:{
    executionId:string;status:'SUCCEEDED'|'FAILED';started:number;
    route?:BudgetRoute;error?:unknown;
  }):Promise<void>{
    await this.pool.query(
      `update ai.execution e set
          provider_key=$2,model_key=$3,status=$4,latency_ms=$5,error_code=$6,
          attempt_count=(select count(*)::int from ai.execution_attempt where execution_id=e.id),
          input_tokens=(select coalesce(sum(input_tokens),0)::int from ai.execution_attempt where execution_id=e.id),
          output_tokens=(select coalesce(sum(output_tokens),0)::int from ai.execution_attempt where execution_id=e.id),
          estimated_cost_usd=(select coalesce(sum(coalesce(estimated_cost_usd,reserved_cost_usd)),0)
                                from ai.execution_attempt where execution_id=e.id)
        where e.id=$1`,
      [input.executionId,input.route?.provider_key??null,input.route?.key??null,
        input.status,Date.now()-input.started,errorCode(input.error)],
    );
  }
}

export function estimateInputTokens(system:string,prompt:string):number{
  return Math.max(1,Math.ceil(Buffer.byteLength(`${system}\n${prompt}`,'utf8')/4));
}
export function estimateCost(route:BudgetRoute,inputTokens=0,outputTokens=0):number{
  return inputTokens/1_000_000*Number(route.input_cost_per_million??0)+
    outputTokens/1_000_000*Number(route.output_cost_per_million??0);
}
function assertPriced(route:BudgetRoute){
  const input=optionalNumber(route.input_cost_per_million);
  const output=optionalNumber(route.output_cost_per_million);
  if(input==null||output==null||input<0||output<0)
    throw budgetError('AI_MODEL_PRICING_MISSING');
}
function optionalNumber(value:unknown):number|null{
  if(value==null||value==='')return null;
  const result=Number(value);
  return Number.isFinite(result)?result:null;
}
function budgetError(code:string){return Object.assign(new Error(code),{name:'AIBudgetError'});}
function errorCode(error:unknown):string|null{
  if(error==null)return null;
  return String(error instanceof Error?error.message:error).slice(0,120);
}
