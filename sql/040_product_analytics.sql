begin;
create schema if not exists analytics;

create table if not exists analytics.event(
 id uuid primary key,
 event_name text not null,
 anonymous_session_id text not null,
 properties jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null,
 received_at timestamptz not null default now(),
 abuse_bucket text null
);
create index if not exists ix_analytics_event_time
 on analytics.event(occurred_at desc);
create index if not exists ix_analytics_event_session
 on analytics.event(anonymous_session_id,occurred_at);
create index if not exists ix_analytics_event_name
 on analytics.event(event_name,occurred_at desc);

create table if not exists analytics.experiment(
 id text primary key,
 name text not null,
 hypothesis text not null,
 primary_metric text not null,
 guardrail_metrics jsonb not null default '[]'::jsonb,
 variants jsonb not null,
 status text not null default 'DRAFT',
 starts_at timestamptz null,
 ends_at timestamptz null,
 owner text not null,
 created_at timestamptz not null default now(),
 constraint ck_experiment_status check(
  status in ('DRAFT','APPROVED','RUNNING','PAUSED','COMPLETED','CANCELLED')
 )
);

create table if not exists analytics.experiment_decision(
 id uuid primary key,
 experiment_id text not null references analytics.experiment(id),
 decision text not null,
 evidence jsonb not null default '{}'::jsonb,
 decided_by text not null,
 decided_at timestamptz not null default now()
);

commit;
