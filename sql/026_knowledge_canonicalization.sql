begin;

create schema if not exists knowledge;

create table if not exists knowledge.claim (
  id uuid primary key,
  subject_type text not null,
  subject_id uuid not null,
  property_key text not null,
  value jsonb not null,
  claimant_type text not null,
  claimant_id text null,
  source_snapshot_id uuid null,
  source_url text null,
  observed_at timestamptz not null,
  confidence numeric null check (confidence is null or confidence between 0 and 1),
  status text not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  constraint ck_claim_status check (
    status in ('ACTIVE','REJECTED','DISPUTED','SUPERSEDED')
  )
);

create index if not exists ix_claim_subject_property
  on knowledge.claim(subject_type,subject_id,property_key,observed_at desc);

create table if not exists knowledge.claim_conflict (
  id uuid primary key,
  subject_type text not null,
  subject_id uuid not null,
  property_key text not null,
  status text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolved_by text null,
  constraint ck_claim_conflict_status check (status in ('OPEN','RESOLVED'))
);

create unique index if not exists ux_open_claim_conflict
  on knowledge.claim_conflict(subject_type,subject_id,property_key)
  where status='OPEN';

create table if not exists knowledge.canonical_proposal (
  id uuid primary key,
  subject_type text not null,
  subject_id uuid not null,
  property_key text not null,
  proposed_value jsonb not null,
  evidence_ids uuid[] not null,
  status text not null default 'PENDING',
  created_by text not null,
  created_at timestamptz not null default now(),
  decided_by text null,
  decided_at timestamptz null,
  decision_reason text null,
  version integer not null default 1,
  constraint ck_canonical_proposal_status check (
    status in ('PENDING','APPROVED','REJECTED')
  ),
  constraint ck_proposal_evidence check (cardinality(evidence_ids) > 0)
);

create index if not exists ix_proposal_queue
  on knowledge.canonical_proposal(status,created_at);

create table if not exists knowledge.canonical_fact (
  id uuid primary key,
  subject_type text not null,
  subject_id uuid not null,
  property_key text not null,
  value jsonb not null,
  unit text null,
  valid_from timestamptz not null,
  valid_to timestamptz null,
  proposal_id uuid not null references knowledge.canonical_proposal(id),
  decided_by text not null,
  decision_reason text not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  constraint ck_canonical_validity check (
    valid_to is null or valid_to > valid_from
  )
);

create unique index if not exists ux_current_canonical_fact
  on knowledge.canonical_fact(subject_type,subject_id,property_key)
  where valid_to is null;

create index if not exists ix_canonical_history
  on knowledge.canonical_fact(
    subject_type,subject_id,property_key,valid_from desc
  );

create table if not exists ops.cache_invalidation (
  id uuid primary key,
  cache_key text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz null
);

commit;
