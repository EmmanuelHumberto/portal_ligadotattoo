BEGIN;
CREATE TABLE source.source (
 id uuid PRIMARY KEY, name text NOT NULL, source_type text NOT NULL, base_url text,
 lifecycle text NOT NULL CHECK(lifecycle IN ('DISCOVERED','UNDER_REVIEW','ACTIVE','PAUSED','BLOCKED','RETIRED')),
 trust_profile text NOT NULL CHECK(trust_profile IN ('UNKNOWN','LOW','MEDIUM','HIGH','PRIMARY')),
 collection_policy jsonb NOT NULL DEFAULT '{}'::jsonb, rate_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 compliance_status text NOT NULL CHECK(compliance_status IN ('UNKNOWN','REVIEWED','APPROVED','RESTRICTED','BLOCKED')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE source.endpoint (
 id uuid PRIMARY KEY, source_id uuid NOT NULL REFERENCES source.source(id), endpoint_type text NOT NULL,
 url text NOT NULL, connector_key text NOT NULL, connector_version text NOT NULL, active boolean NOT NULL DEFAULT true,
 configuration jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 UNIQUE(source_id,url));
COMMIT;
