BEGIN;
CREATE TABLE laboratory.measurement_session (
 id uuid PRIMARY KEY, product_model_id uuid NOT NULL REFERENCES catalog.product_model(id),
 variant_id uuid REFERENCES catalog.product_variant(id), methodology_key text NOT NULL, methodology_version text NOT NULL,
 status text NOT NULL CHECK(status IN ('DRAFT','RUNNING','COMPLETED','INVALIDATED')),
 performed_at timestamptz, performed_by text, environment_json jsonb, version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE laboratory.raw_artifact (
 id uuid PRIMARY KEY, measurement_session_id uuid NOT NULL REFERENCES laboratory.measurement_session(id),
 storage_key text NOT NULL, sha256 text NOT NULL, mime_type text, byte_size bigint NOT NULL CHECK(byte_size>=0),
 created_at timestamptz NOT NULL);
CREATE TABLE laboratory.processing_run (
 id uuid PRIMARY KEY, measurement_session_id uuid NOT NULL REFERENCES laboratory.measurement_session(id),
 processor_key text NOT NULL, processor_version text NOT NULL, status text NOT NULL,
 parameters_json jsonb NOT NULL DEFAULT '{}'::jsonb, started_at timestamptz NOT NULL, completed_at timestamptz,
 error_detail text, created_at timestamptz NOT NULL);
CREATE TABLE laboratory.derived_metric (
 id uuid PRIMARY KEY, processing_run_id uuid NOT NULL REFERENCES laboratory.processing_run(id),
 property_definition_id uuid REFERENCES knowledge.property_definition(id), metric_key text NOT NULL,
 value_numeric numeric, value_text text, unit text, uncertainty_numeric numeric,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL,
 CHECK(value_numeric IS NOT NULL OR value_text IS NOT NULL));
COMMIT;
