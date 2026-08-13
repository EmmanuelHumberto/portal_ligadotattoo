BEGIN;
CREATE TABLE service.technical_issue (
 id uuid PRIMARY KEY, title text NOT NULL, summary text, issue_type text NOT NULL,
 status text NOT NULL CHECK(status IN ('REPORTED','RECURRENT_OBSERVED','UNDER_ANALYSIS','TECHNICALLY_VALIDATED','DISPUTED','RESOLVED','REJECTED')),
 severity text NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL','UNKNOWN')),
 first_observed_at timestamptz, validated_at timestamptz, resolved_at timestamptz,
 public_visibility text NOT NULL CHECK(public_visibility IN ('PRIVATE','REVIEW','PUBLIC')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE service.technical_issue_product (
 technical_issue_id uuid NOT NULL REFERENCES service.technical_issue(id),
 product_model_id uuid NOT NULL REFERENCES catalog.product_model(id), relation_type text NOT NULL,
 PRIMARY KEY(technical_issue_id,product_model_id));
CREATE TABLE service.technical_issue_evidence (
 id uuid PRIMARY KEY, technical_issue_id uuid NOT NULL REFERENCES service.technical_issue(id),
 evidence_type text NOT NULL, source_snapshot_id uuid REFERENCES ingestion.snapshot(id),
 media_asset_id uuid REFERENCES media.asset(id), notes text, created_at timestamptz NOT NULL);
CREATE TABLE service.manufacturer_response (
 id uuid PRIMARY KEY, technical_issue_id uuid NOT NULL REFERENCES service.technical_issue(id),
 manufacturer_id uuid NOT NULL REFERENCES catalog.manufacturer(id), response_text text NOT NULL,
 source_snapshot_id uuid REFERENCES ingestion.snapshot(id), received_at timestamptz, created_at timestamptz NOT NULL);
CREATE TABLE service.issue_resolution (
 id uuid PRIMARY KEY, technical_issue_id uuid NOT NULL REFERENCES service.technical_issue(id),
 resolution_type text NOT NULL, summary text NOT NULL, resolved_by_actor_id uuid REFERENCES iam.actor(id),
 created_at timestamptz NOT NULL);
COMMIT;
