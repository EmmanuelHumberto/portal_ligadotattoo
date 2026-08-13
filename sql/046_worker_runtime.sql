begin;

alter table ops.outbox_event
  add column if not exists last_error text null;

alter table ops.job
  add column if not exists source_event_id uuid null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_error text null;

create unique index if not exists ux_job_source_event_type
  on ops.job(source_event_id,job_type)
  where source_event_id is not null;

alter table ops.cache_invalidation
  add column if not exists source_event_id uuid null;

create unique index if not exists ux_cache_invalidation_source_key
  on ops.cache_invalidation(source_event_id,cache_key)
  where source_event_id is not null;

commit;
