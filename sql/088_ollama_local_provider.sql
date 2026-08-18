begin;

insert into ai.provider(provider_key,label,secret_ref,enabled)
values ('ollama','Ollama local','OLLAMA_BASE_URL',true)
on conflict (provider_key) do update
  set label=excluded.label,enabled=true,updated_at=now();

insert into ai.model(
  key,provider_key,provider_model_id,label,enabled,
  max_input_tokens,max_output_tokens,input_cost_per_million,output_cost_per_million
) values (
  'qwen3.5-0.8b-local','ollama','qwen3.5:0.8b','Qwen 3.5 0.8B local',true,
  8192,2500,0,0
)
on conflict (key) do update
  set provider_model_id=excluded.provider_model_id,
      label=excluded.label,
      enabled=true,
      max_input_tokens=excluded.max_input_tokens,
      max_output_tokens=excluded.max_output_tokens,
      input_cost_per_million=0,
      output_cost_per_million=0,
      updated_at=now();

update ai.workload_route
   set priority=priority+1
 where workload_key in (
   'editorial.classify','editorial.summarize','editorial.draft',
   'editorial.extract_event','catalog.translate'
 ) and model_key<>'qwen3.5-0.8b-local';

insert into ai.workload_route(workload_key,model_key,priority,enabled)
select workload_key,'qwen3.5-0.8b-local',1,true
  from ai.workload_policy
 where workload_key in (
   'editorial.classify','editorial.summarize','editorial.draft',
   'editorial.extract_event','catalog.translate'
 )
on conflict (workload_key,model_key) do update
  set priority=1,enabled=true;

update ai.workload_policy
   set timeout_ms=case
     when workload_key='editorial.draft' then 300000
     else 180000
   end,
   max_attempts=2,
   updated_at=now()
 where workload_key in (
   'editorial.classify','editorial.summarize','editorial.draft',
   'editorial.extract_event','catalog.translate'
 );

commit;
