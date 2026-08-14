begin;

create schema if not exists laboratory;

create table if not exists laboratory.measurement_session (
  id uuid primary key,
  product_model_id uuid not null references catalog.product_model(id),
  methodology_key text not null,
  methodology_version text not null,
  status text not null default 'DRAFT',
  performed_at timestamptz null,
  performed_by text null,
  environment_json jsonb null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_measurement_session_status check (
    status in ('DRAFT','RUNNING','COMPLETED','INVALIDATED')
  )
);

create table if not exists laboratory.raw_artifact (
  id uuid primary key,
  measurement_session_id uuid not null references laboratory.measurement_session(id),
  storage_key text not null,
  sha256 text not null,
  mime_type text null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  created_at timestamptz not null default now()
);

create table if not exists laboratory.processing_run (
  id uuid primary key,
  measurement_session_id uuid not null references laboratory.measurement_session(id),
  processor_key text not null,
  processor_version text not null,
  status text not null,
  parameters_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  error_detail text null,
  created_at timestamptz not null default now()
);

create table if not exists laboratory.derived_metric (
  id uuid primary key,
  processing_run_id uuid not null references laboratory.processing_run(id),
  metric_key text not null,
  value_numeric numeric null,
  value_text text null,
  unit text null,
  uncertainty_numeric numeric null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ck_derived_metric_value check (
    value_numeric is not null or value_text is not null
  )
);

commit;
