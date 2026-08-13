BEGIN;
CREATE TABLE ingestion.crawl_target (
 id uuid PRIMARY KEY, source_endpoint_id uuid NOT NULL REFERENCES source.endpoint(id), target_url text NOT NULL,
 target_type text NOT NULL, priority integer NOT NULL DEFAULT 0, next_run_at timestamptz, last_run_at timestamptz,
 etag text, last_modified text, status text NOT NULL CHECK(status IN ('ACTIVE','PAUSED','FAILED','RETIRED')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE ingestion.snapshot (
 id uuid PRIMARY KEY, source_id uuid NOT NULL REFERENCES source.source(id),
 source_endpoint_id uuid REFERENCES source.endpoint(id), requested_url text NOT NULL, final_url text NOT NULL,
 storage_key text NOT NULL, sha256 text NOT NULL, mime_type text, http_status integer, captured_at timestamptz NOT NULL,
 headers_json jsonb NOT NULL DEFAULT '{}'::jsonb, metadata jsonb NOT NULL DEFAULT '{}'::jsonb);
CREATE INDEX snapshot_source_time_idx ON ingestion.snapshot(source_id,captured_at DESC);
CREATE TABLE ingestion.acquisition_run (
 id uuid PRIMARY KEY, crawl_target_id uuid NOT NULL REFERENCES ingestion.crawl_target(id),
 started_at timestamptz NOT NULL, completed_at timestamptz,
 status text NOT NULL CHECK(status IN ('RUNNING','SUCCEEDED','NOT_MODIFIED','FAILED','BLOCKED')),
 http_status integer, final_url text, content_type text, content_length bigint,
 snapshot_id uuid REFERENCES ingestion.snapshot(id), error_code text, error_detail text, correlation_id uuid);
CREATE TABLE ingestion.extraction_run (
 id uuid PRIMARY KEY, snapshot_id uuid NOT NULL REFERENCES ingestion.snapshot(id), extractor_key text NOT NULL,
 extractor_version text NOT NULL, method text NOT NULL CHECK(method IN ('DETERMINISTIC','AI_ASSISTED','HYBRID')),
 status text NOT NULL CHECK(status IN ('RUNNING','SUCCEEDED','FAILED','PARTIAL')), output_json jsonb,
 started_at timestamptz NOT NULL, completed_at timestamptz, error_code text, error_detail text);
CREATE TABLE ingestion.extracted_entity (
 id uuid PRIMARY KEY, extraction_run_id uuid NOT NULL REFERENCES ingestion.extraction_run(id),
 entity_type text NOT NULL, external_key text, payload jsonb NOT NULL,
 confidence numeric(5,4) CHECK(confidence IS NULL OR (confidence>=0 AND confidence<=1)), created_at timestamptz NOT NULL);
CREATE TABLE ingestion.resolution_candidate (
 id uuid PRIMARY KEY, extracted_entity_id uuid NOT NULL REFERENCES ingestion.extracted_entity(id),
 candidate_type text NOT NULL, candidate_id uuid, score numeric(7,6) CHECK(score IS NULL OR (score>=0 AND score<=1)),
 signals jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL CHECK(status IN ('AUTO_MATCHED','REVIEW_REQUIRED','MATCHED','REJECTED','NO_MATCH')),
 resolved_by_actor_id uuid REFERENCES iam.actor(id), resolved_at timestamptz,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
COMMIT;
