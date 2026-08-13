begin;

create table if not exists ops.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists ix_audit_subject
  on ops.audit_log(subject_type, subject_id, occurred_at desc);

alter table if exists ops.outbox_event
  add column if not exists attempts integer not null default 0,
  add column if not exists available_at timestamptz not null default now();

create table if not exists ops.job (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  job_version integer not null default 1,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  max_attempts integer not null default 8,
  available_at timestamptz not null default now(),
  locked_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint ck_job_status check (status in ('PENDING','RUNNING','RETRY','DONE','DEAD'))
);

create index if not exists ix_job_reservation
  on ops.job(status, available_at);

commit;
