begin;

create table if not exists editorial.pipeline_setting (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into editorial.pipeline_setting(key, value)
values ('auto_draft_enabled', 'true')
on conflict (key) do nothing;

commit;
