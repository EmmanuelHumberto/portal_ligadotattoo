begin;

update ai.model set max_output_tokens=16000 where key='deepseek-v4-flash';
update ai.workload_policy set max_output_tokens=16000 where workload_key='editorial.draft';

commit;
