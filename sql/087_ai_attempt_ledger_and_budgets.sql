begin;

alter table ai.workload_policy
  add column if not exists daily_budget_usd numeric null,
  add column if not exists monthly_budget_usd numeric null;

create table if not exists ai.execution_attempt (
  id uuid primary key,
  execution_id uuid not null references ai.execution(id) on delete cascade,
  attempt_no integer not null check(attempt_no > 0),
  provider_key text not null,
  model_key text not null,
  status text not null,
  estimated_input_tokens integer not null check(estimated_input_tokens >= 0),
  reserved_cost_usd numeric not null check(reserved_cost_usd >= 0),
  input_tokens integer null check(input_tokens >= 0),
  output_tokens integer null check(output_tokens >= 0),
  estimated_cost_usd numeric null check(estimated_cost_usd >= 0),
  latency_ms integer null check(latency_ms >= 0),
  provider_request_id text null,
  error_code text null,
  created_at timestamptz not null default now(),
  finished_at timestamptz null,
  unique(execution_id,attempt_no),
  constraint ck_ai_attempt_status check(status in ('RUNNING','SUCCEEDED','FAILED'))
);

create index if not exists ix_ai_attempt_budget
  on ai.execution_attempt(created_at,execution_id);

update ai.workload_policy
   set max_estimated_cost_usd=coalesce(max_estimated_cost_usd,0.01),
       daily_budget_usd=coalesce(daily_budget_usd,
         case when workload_key='editorial.draft' then 1.00 else 0.25 end),
       monthly_budget_usd=coalesce(monthly_budget_usd,
         case when workload_key='editorial.draft' then 20.00 else 5.00 end),
       updated_at=now();

commit;
