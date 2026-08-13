create table if not exists platform_setting(
 key text primary key,
 value text not null,
 updated_at timestamptz not null default now()
);
