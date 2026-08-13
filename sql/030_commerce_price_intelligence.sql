begin;

create schema if not exists commerce;

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

alter table if exists commerce.listing
  add column if not exists normalized_url text null,
  add column if not exists external_id text null,
  add column if not exists affiliate_mode text not null default 'NONE',
  add column if not exists last_observed_at timestamptz null,
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ux_listing_seller_normalized_url
  on commerce.listing(seller_id,normalized_url)
  where normalized_url is not null;

alter table if exists commerce.price_observation
  add column if not exists availability text not null default 'UNKNOWN',
  add column if not exists source_snapshot_id uuid null;

create unique index if not exists ux_price_observation_identity
  on commerce.price_observation(listing_id,observed_at,amount,currency);

create table if not exists commerce.price_trend (
  product_model_id uuid not null,
  currency text not null,
  min_30d numeric not null,
  max_30d numeric not null,
  avg_30d numeric not null,
  latest_amount numeric not null,
  latest_observed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(product_model_id,currency)
);

create table if not exists commerce.listing_candidate (
  id uuid primary key,
  source_id uuid not null references ingestion.source(id),
  snapshot_id uuid not null unique references ingestion.snapshot(id),
  title text not null,
  proposed_product_model_id uuid null,
  proposed_seller_id uuid null,
  proposed_url text null,
  proposed_amount numeric null,
  proposed_currency text null,
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by text null,
  constraint ck_listing_candidate_status check(
    status in ('NEW','ACCEPTED','REJECTED','DUPLICATE')
  )
);

commit;
