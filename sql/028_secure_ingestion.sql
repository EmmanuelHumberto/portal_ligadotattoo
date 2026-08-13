begin;

create schema if not exists ingestion;

create table if not exists ingestion.source (
  id uuid primary key,
  name text not null,
  kind text not null,
  base_url text not null,
  allowed_hosts text[] not null,
  robots_policy text not null default 'RESPECT',
  crawl_delay_ms integer not null default 1000 check (crawl_delay_ms >= 250),
  status text not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_source_status check (status in ('ACTIVE','PAUSED','DISABLED')),
  constraint ck_robots_policy check (
    robots_policy in ('RESPECT','MANUAL_ALLOW','DISABLED')
  )
);

create table if not exists ingestion.crawl_target (
  id uuid primary key,
  source_id uuid not null references ingestion.source(id),
  url text not null,
  discovery_mode text not null default 'MIXED',
  schedule_key text null,
  max_bytes integer not null default 5000000,
  status text not null default 'ACTIVE',
  last_crawled_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(source_id,url),
  constraint ck_discovery_mode check (
    discovery_mode in ('EDITORIAL','CATALOG','MIXED','SNAPSHOT_ONLY')
  ),
  constraint ck_target_status check (status in ('ACTIVE','PAUSED','DISABLED'))
);

create table if not exists ingestion.snapshot (
  id uuid primary key,
  source_id uuid not null references ingestion.source(id),
  target_id uuid null references ingestion.crawl_target(id),
  url text not null,
  content_type text null,
  http_status integer not null,
  sha256 text not null,
  body_bytes bytea not null,
  observed_at timestamptz not null,
  unique(source_id,sha256)
);

create table if not exists ingestion.run (
  id uuid primary key,
  source_id uuid not null references ingestion.source(id),
  target_id uuid null references ingestion.crawl_target(id),
  status text not null,
  started_at timestamptz not null,
  finished_at timestamptz null,
  snapshot_id uuid null references ingestion.snapshot(id),
  deduplicated boolean not null default false,
  error_code text null,
  error_message text null,
  constraint ck_ingestion_run_status check (
    status in ('RUNNING','SUCCEEDED','FAILED','CANCELLED')
  )
);

create index if not exists ix_ingestion_run_admin
  on ingestion.run(started_at desc,status,source_id);

create table if not exists ingestion.extraction (
  id uuid primary key,
  snapshot_id uuid not null unique references ingestion.snapshot(id),
  title text null,
  text_content text not null,
  structured_data jsonb not null default '{}'::jsonb,
  fingerprint text not null,
  created_at timestamptz not null default now()
);

create table if not exists ingestion.discovery_candidate (
  id uuid primary key,
  source_id uuid not null references ingestion.source(id),
  snapshot_id uuid not null references ingestion.snapshot(id),
  candidate_type text not null,
  title text not null,
  fingerprint text not null,
  status text not null default 'NEW',
  resolved_subject_type text null,
  resolved_subject_id uuid null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by text null,
  unique(source_id,fingerprint,candidate_type),
  constraint ck_discovery_status check (
    status in ('NEW','ACCEPTED','REJECTED','DUPLICATE')
  )
);

create unique index if not exists ux_story_candidate_snapshot
  on editorial.story_candidate(source_snapshot_id)
  where source_snapshot_id is not null;

commit;
