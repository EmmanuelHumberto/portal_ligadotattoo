begin;

create index if not exists ix_audit_event_created
  on ops.audit_event(created_at desc);

create index if not exists ix_audit_event_subject
  on ops.audit_event(subject_type,subject_id,created_at desc);

create index if not exists ix_audit_event_actor
  on ops.audit_event(actor_id,created_at desc);

create table if not exists ops.dead_letter (
  id uuid primary key,
  source_type text not null,
  source_id uuid null,
  kind text not null,
  error_code text null,
  error_summary text null,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  attempt_count integer not null default 1,
  status text not null default 'OPEN',
  resolved_at timestamptz null,
  resolved_by text null,
  constraint ck_dead_letter_status check(
    status in ('OPEN','REQUEUED','RESOLVED','IGNORED')
  )
);

create index if not exists ix_dead_letter_ops
  on ops.dead_letter(status,last_failed_at desc);

create index if not exists ix_job_ops
  on ops.job(status,created_at desc);

create index if not exists ix_outbox_ops
  on ops.outbox_event(status,created_at desc);

create index if not exists ix_cache_invalidation_ops
  on ops.cache_invalidation(created_at desc);

commit;
