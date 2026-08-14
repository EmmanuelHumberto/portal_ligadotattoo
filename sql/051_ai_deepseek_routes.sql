begin;

insert into ai.model(
  key,provider_key,provider_model_id,label,max_input_tokens,max_output_tokens
) values
 ('deepseek-v4-flash','deepseek','deepseek-v4-flash','DeepSeek V4 Flash',128000,8192)
on conflict (key) do nothing;

insert into ai.workload_route(workload_key,model_key,priority,enabled)
select w.workload_key,'deepseek-v4-flash',1,true
  from ai.workload_policy w
 where w.workload_key in ('editorial.classify','editorial.summarize',
                          'editorial.draft','editorial.extract_event')
on conflict (workload_key,model_key) do nothing;

commit;
