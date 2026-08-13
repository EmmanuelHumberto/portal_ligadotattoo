create schema if not exists catalog;
create schema if not exists knowledge;
create schema if not exists editorial;
create schema if not exists media;
create schema if not exists commerce;
create schema if not exists ops;
create schema if not exists audit;
create schema if not exists analytics;

create table if not exists ops.outbox_event (
  id uuid primary key,
  event_type text not null,
  event_version integer not null check (event_version > 0),
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  occurred_at timestamptz not null,
  published_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists ops.audit_event (
  id uuid primary key default gen_random_uuid(),
  actor_id text null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists catalog.manufacturer (
  id uuid primary key,
  name text not null,
  normalized_name text not null,
  slug text not null unique,
  official_website text null,
  country_code text null,
  status text not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog.brand (
  id uuid primary key,
  manufacturer_id uuid null references catalog.manufacturer(id),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog.product_model (
  id uuid primary key,
  manufacturer_id uuid not null references catalog.manufacturer(id),
  brand_id uuid null references catalog.brand(id),
  product_type_key text not null,
  name text not null,
  normalized_name text not null,
  slug text not null unique,
  model_code text null,
  lifecycle text not null default 'UNKNOWN',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commerce.seller (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  website_url text not null,
  status text not null default 'ACTIVE',
  affiliate_template text null,
  public_freshness_interval interval not null default interval '24 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_seller_status check(status in ('ACTIVE','PAUSED','DISABLED'))
);

create table if not exists commerce.listing (
  id uuid primary key,
  seller_id uuid not null references commerce.seller(id),
  product_model_id uuid not null references catalog.product_model(id),
  external_id text null,
  url text not null,
  normalized_url text null,
  affiliate_mode text not null default 'NONE',
  availability text not null default 'UNKNOWN',
  status text not null default 'ACTIVE',
  last_observed_at timestamptz null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commerce.price_observation (
  id uuid primary key,
  listing_id uuid not null references commerce.listing(id),
  amount numeric not null check (amount >= 0),
  currency text not null,
  availability text not null default 'UNKNOWN',
  observed_at timestamptz not null,
  source_snapshot_id uuid null
);
