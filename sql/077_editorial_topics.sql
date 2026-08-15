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

insert into editorial.topic (name, query, language)
select v.name, v.query, v.language
from (values
  ('Cuidados pós-tatuagem', 'tattoo aftercare', 'pt-BR'),
  ('Máquinas de tatuagem', 'tattoo machine', 'pt-BR'),
  ('Tintas para tatuagem', 'tattoo ink', 'pt-BR'),
  ('Higiene e biossegurança', 'tattoo studio hygiene', 'pt-BR')
) as v(name, query, language)
where not exists (select 1 from editorial.topic t where t.name = v.name);

commit;
