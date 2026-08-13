begin;

create schema if not exists editorial;
create schema if not exists ai;

create table if not exists editorial.story_candidate (
  id uuid primary key,
  source_id uuid not null,
  source_snapshot_id uuid null,
  source_url text not null,
  title text not null,
  detected_type text null,
  relevance_score numeric null check (
    relevance_score is null or relevance_score between 0 and 1
  ),
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  constraint ck_story_candidate_status check (
    status in ('NEW','QUALIFIED','DRAFTED','DISMISSED')
  )
);

create table if not exists editorial.content (
  id uuid primary key,
  content_type text not null,
  title text not null,
  slug text not null unique,
  subtitle text null,
  summary text null,
  body_document jsonb not null,
  status text not null default 'DRAFT',
  origin text not null default 'HUMAN',
  created_by text not null,
  approved_by text null,
  scheduled_at timestamptz null,
  published_at timestamptz null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_editorial_type check (
    content_type in ('NEWS','BLOG','EVENT','TECHNICAL_ARTICLE','NOTICE')
  ),
  constraint ck_editorial_status check (
    status in ('DRAFT','IN_REVIEW','APPROVED','SCHEDULED',
               'PUBLISHED','REJECTED','ARCHIVED')
  ),
  constraint ck_editorial_origin check (
    origin in ('HUMAN','AI_ASSISTED','INGESTION_ASSISTED')
  )
);

create index if not exists ix_editorial_public
  on editorial.content(status,published_at desc);

create index if not exists ix_editorial_review
  on editorial.content(status,updated_at desc);

create table if not exists editorial.content_source (
  content_id uuid not null references editorial.content(id) on delete cascade,
  source_id uuid null,
  source_snapshot_id uuid null,
  source_url text not null,
  label text null,
  sort_order integer not null default 0,
  primary key(content_id,source_url)
);

create table if not exists editorial.content_product (
  content_id uuid not null references editorial.content(id) on delete cascade,
  product_id uuid not null,
  relation_type text not null default 'RELATED',
  primary key(content_id,product_id,relation_type)
);

create table if not exists editorial.content_media (
  content_id uuid not null references editorial.content(id) on delete cascade,
  media_asset_id uuid not null references media.media_asset(id),
  role text not null default 'BODY',
  sort_order integer not null default 0,
  primary key(content_id,media_asset_id,role)
);

create table if not exists editorial.event_detail (
  content_id uuid primary key references editorial.content(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz null,
  timezone text not null,
  venue_name text null,
  city text null,
  country_code text null,
  official_url text null,
  event_status text not null default 'SCHEDULED',
  constraint ck_event_status check (
    event_status in ('SCHEDULED','POSTPONED','CANCELLED','COMPLETED')
  )
);

create table if not exists ai.execution (
  id uuid primary key,
  workload_key text not null,
  provider_key text not null,
  model_key text not null,
  status text not null,
  latency_ms integer null,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

commit;
