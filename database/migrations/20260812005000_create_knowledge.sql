BEGIN;
CREATE TABLE knowledge.property_definition (
 id uuid PRIMARY KEY, key text NOT NULL UNIQUE, name text NOT NULL, description text,
 value_type text NOT NULL CHECK(value_type IN ('TEXT','INTEGER','DECIMAL','BOOLEAN','DATE','ENUM','MEASUREMENT','REFERENCE','JSON')),
 unit_dimension text, canonical_unit text, allowed_units jsonb, constraints_json jsonb,
 applicable_product_types jsonb, status text NOT NULL CHECK(status IN ('ACTIVE','DEPRECATED','DRAFT')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE knowledge.claim (
 id uuid PRIMARY KEY, subject_type text NOT NULL, subject_id uuid NOT NULL,
 property_definition_id uuid NOT NULL REFERENCES knowledge.property_definition(id), value_json jsonb NOT NULL,
 normalized_value_text text, claimant_type text NOT NULL, claimant_id text, source_snapshot_id uuid,
 source_url text, observed_at timestamptz, status text NOT NULL
 CHECK(status IN ('OBSERVED','UNDER_REVIEW','SUPPORTED','DISPUTED','REJECTED','SUPERSEDED')),
 confidence numeric(5,4) CHECK(confidence IS NULL OR (confidence>=0 AND confidence<=1)),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE knowledge.evidence_reference (
 id uuid PRIMARY KEY, claim_id uuid REFERENCES knowledge.claim(id), evidence_type text NOT NULL,
 source_snapshot_id uuid, media_asset_id uuid REFERENCES media.asset(id), laboratory_run_id uuid,
 technical_issue_id uuid, external_url text, locator jsonb, notes text, created_at timestamptz NOT NULL);
CREATE TABLE knowledge.canonical_proposal (
 id uuid PRIMARY KEY, subject_type text NOT NULL, subject_id uuid NOT NULL,
 property_definition_id uuid NOT NULL REFERENCES knowledge.property_definition(id), proposed_value_json jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','SUPERSEDED')),
 proposed_by_actor_id uuid REFERENCES iam.actor(id), decision_reason text, version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE knowledge.canonical_fact (
 id uuid PRIMARY KEY, subject_type text NOT NULL, subject_id uuid NOT NULL,
 property_definition_id uuid NOT NULL REFERENCES knowledge.property_definition(id), value_json jsonb NOT NULL,
 normalized_value_text text, valid_from timestamptz NOT NULL, valid_to timestamptz, decision_id uuid,
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE UNIQUE INDEX canonical_active_unique_idx ON knowledge.canonical_fact(subject_type,subject_id,property_definition_id) WHERE valid_to IS NULL;
CREATE TABLE knowledge.canonical_decision (
 id uuid PRIMARY KEY, proposal_id uuid NOT NULL REFERENCES knowledge.canonical_proposal(id),
 actor_id uuid NOT NULL REFERENCES iam.actor(id), decision text NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
 reason text NOT NULL, previous_canonical_fact_id uuid REFERENCES knowledge.canonical_fact(id),
 resulting_canonical_fact_id uuid REFERENCES knowledge.canonical_fact(id), created_at timestamptz NOT NULL);
ALTER TABLE knowledge.canonical_fact ADD CONSTRAINT canonical_fact_decision_fk
 FOREIGN KEY(decision_id) REFERENCES knowledge.canonical_decision(id);
COMMIT;
