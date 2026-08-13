begin;

create table if not exists ops.worker_heartbeat (
  instance_id uuid primary key,
  status text not null,
  processor_count integer not null check(processor_count > 0),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_tick_started_at timestamptz null,
  last_tick_completed_at timestamptz null,
  last_tick_duration_ms integer null check(last_tick_duration_ms >= 0),
  last_tick_failures integer null check(last_tick_failures >= 0),
  stopped_at timestamptz null,
  constraint ck_worker_heartbeat_status check(
    status in ('STARTING','RUNNING','STOPPED')
  )
);

create index if not exists ix_worker_heartbeat_status_seen
  on ops.worker_heartbeat(status,last_seen_at desc);

commit;
