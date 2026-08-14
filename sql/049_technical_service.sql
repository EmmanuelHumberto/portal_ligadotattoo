begin;

create schema if not exists service;

create table if not exists service.technical_issue (
  id uuid primary key,
  title text not null,
  summary text null,
  issue_type text not null,
  status text not null default 'REPORTED',
  severity text not null default 'UNKNOWN',
  first_observed_at timestamptz null,
  validated_at timestamptz null,
  resolved_at timestamptz null,
  public_visibility text not null default 'PRIVATE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_technical_issue_status check (
    status in ('REPORTED','RECURRENT_OBSERVED','UNDER_ANALYSIS',
               'TECHNICALLY_VALIDATED','DISPUTED','RESOLVED','REJECTED')
  ),
  constraint ck_technical_issue_severity check (
    severity in ('LOW','MEDIUM','HIGH','CRITICAL','UNKNOWN')
  ),
  constraint ck_technical_issue_visibility check (
    public_visibility in ('PRIVATE','REVIEW','PUBLIC')
  )
);

create table if not exists service.technical_issue_product (
  technical_issue_id uuid not null references service.technical_issue(id),
  product_model_id uuid not null references catalog.product_model(id),
  relation_type text not null,
  primary key (technical_issue_id, product_model_id)
);

create table if not exists service.technical_issue_evidence (
  id uuid primary key,
  technical_issue_id uuid not null references service.technical_issue(id),
  evidence_type text not null,
  source_snapshot_id uuid null references ingestion.snapshot(id),
  media_asset_id uuid null references media.media_asset(id),
  notes text null,
  created_at timestamptz not null default now()
);

create table if not exists service.manufacturer_response (
  id uuid primary key,
  technical_issue_id uuid not null references service.technical_issue(id),
  manufacturer_id uuid not null references catalog.manufacturer(id),
  response_text text not null,
  source_snapshot_id uuid null references ingestion.snapshot(id),
  received_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists service.issue_resolution (
  id uuid primary key,
  technical_issue_id uuid not null references service.technical_issue(id),
  resolution_type text not null,
  summary text not null,
  resolved_by text null,
  created_at timestamptz not null default now()
);

commit;
