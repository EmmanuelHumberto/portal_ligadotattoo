begin;

update ai.model
   set input_cost_per_million=0.14,
       output_cost_per_million=0.28,
       updated_at=now()
 where key='deepseek-v4-flash';

insert into ai.workload_policy(
  workload_key,timeout_ms,max_attempts,max_output_tokens,
  max_estimated_cost_usd,response_format
) values ('catalog.translate',60000,2,4000,0.01,'json')
on conflict (workload_key) do update
  set timeout_ms=excluded.timeout_ms,
      max_attempts=excluded.max_attempts,
      max_output_tokens=excluded.max_output_tokens,
      max_estimated_cost_usd=excluded.max_estimated_cost_usd,
      response_format=excluded.response_format,
      updated_at=now();

insert into ai.workload_route(workload_key,model_key,priority,enabled)
values ('catalog.translate','deepseek-v4-flash',1,true)
on conflict (workload_key,model_key) do update
  set priority=excluded.priority,enabled=excluded.enabled;

commit;
