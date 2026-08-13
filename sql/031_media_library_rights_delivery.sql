begin;

alter table if exists media.media_asset
  add column if not exists origin_type text not null default 'UPLOAD',
  add column if not exists origin_ref text null;

create table if not exists media.media_rights (
  id uuid primary key,
  media_asset_id uuid not null references media.media_asset(id),
  status text not null,
  basis text null,
  license_name text null,
  source_url text null,
  expires_at timestamptz null,
  notes text null,
  is_current boolean not null default true,
  decided_by text not null,
  decided_at timestamptz not null default now(),
  constraint ck_media_rights_history_status check(
    status in ('UNKNOWN','PENDING','PERMITTED','RESTRICTED','EXPIRED','TAKEDOWN')
  )
);

create unique index if not exists ux_media_current_rights
  on media.media_rights(media_asset_id) where is_current=true;

create index if not exists ix_media_rights_expiry
  on media.media_rights(expires_at)
  where is_current=true and status='PERMITTED' and expires_at is not null;

create table if not exists media.media_variant (
  id uuid primary key,
  media_asset_id uuid not null references media.media_asset(id) on delete cascade,
  variant_key text not null,
  storage_key text not null,
  width integer not null check(width > 0),
  height integer not null check(height > 0),
  mime_type text not null,
  byte_size bigint not null check(byte_size >= 0),
  created_at timestamptz not null default now(),
  unique(media_asset_id,variant_key)
);

commit;
