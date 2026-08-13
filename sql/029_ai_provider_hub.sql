begin;

create schema if not exists ai;

create table if not exists ai.provider (
  provider_key text primary key,
  label text not null,
  enabled boolean not null default true,
  secret_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai.model (
  key text primary key,
  provider_key text not null references ai.provider(provider_key),
  provider_model_id text not null,
  label text not null,
  enabled boolean not null default true,
  max_input_tokens integer null,
  max_output_tokens integer null,
  input_cost_per_million numeric null,
  output_cost_per_million numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai.workload_policy (
  workload_key text primary key,
  enabled boolean not null default true,
  timeout_ms integer not null default 30000,
  max_attempts integer not null default 3,
  max_output_tokens integer not null default 2048,
  max_estimated_cost_usd numeric null,
  response_format text not null default 'json',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_ai_response_format check (response_format in ('json','text'))
);

create table if not exists ai.workload_route (
  workload_key text not null references ai.workload_policy(workload_key),
  model_key text not null references ai.model(key),
  priority integer not null,
  enabled boolean not null default true,
  primary key(workload_key,model_key),
  unique(workload_key,priority)
);

alter table if exists ai.execution
  add column if not exists input_tokens integer null,
  add column if not exists output_tokens integer null,
  add column if not exists estimated_cost_usd numeric null,
  add column if not exists attempt_count integer not null default 1,
  add column if not exists error_code text null;

insert into ai.provider(provider_key,label,secret_ref)
values
 ('openai','OpenAI','OPENAI_API_KEY'),
 ('anthropic','Anthropic','ANTHROPIC_API_KEY'),
 ('deepseek','DeepSeek','DEEPSEEK_API_KEY')
on conflict (provider_key) do nothing;

insert into ai.workload_policy(
  workload_key,timeout_ms,max_attempts,max_output_tokens,response_format
) values
 ('editorial.classify',15000,3,800,'json'),
 ('editorial.summarize',30000,3,1600,'json'),
 ('editorial.draft',60000,3,4000,'json'),
 ('editorial.extract_event',30000,3,1600,'json')
on conflict (workload_key) do nothing;

commit;
