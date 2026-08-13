begin;

create schema if not exists media;
create schema if not exists search;

create table if not exists media.media_asset (
  id uuid primary key,
  kind text not null,
  storage_key text not null unique,
  public_url text null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  sha256 text not null,
  alt_text text null,
  attribution text null,
  rights_status text not null default 'UNKNOWN',
  status text not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_media_rights check (
    rights_status in ('UNKNOWN','PENDING','PERMITTED','RESTRICTED','EXPIRED','TAKEDOWN')
  ),
  constraint ck_media_status check (status in ('ACTIVE','INACTIVE'))
);

create table if not exists media.media_link (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references media.media_asset(id),
  subject_type text not null,
  subject_id uuid not null,
  role text not null default 'GALLERY',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ix_media_link_subject
  on media.media_link(subject_type,subject_id,is_primary desc,sort_order);

create table if not exists search.search_document (
  id uuid primary key,
  source_type text not null,
  source_id uuid not null,
  document_type text not null,
  title text not null,
  normalized_title text not null,
  subtitle text null,
  public_url text not null,
  is_public boolean not null default true,
  popularity_score numeric not null default 0,
  search_vector tsvector not null,
  updated_at timestamptz not null default now(),
  unique(source_type,source_id)
);

create index if not exists ix_search_vector
  on search.search_document using gin(search_vector);

create index if not exists ix_search_prefix
  on search.search_document(normalized_title text_pattern_ops);

commit;
