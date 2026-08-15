begin;

create table if not exists editorial.topic (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  query text not null,
  language text not null default 'pt-BR',
  status text not null default 'ACTIVE',
  max_articles integer not null default 5,
  last_discovered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_topic_status check (status in ('ACTIVE','PAUSED'))
);

commit;
