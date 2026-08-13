BEGIN;
CREATE TABLE ops.import_job (
 id uuid PRIMARY KEY, import_type text NOT NULL, storage_key text NOT NULL,
 status text NOT NULL CHECK(status IN ('UPLOADED','VALIDATING','INVALID','VALIDATED','DRY_RUN','APPROVED','APPLYING','APPLIED','FAILED')),
 validation_report jsonb, dry_run_report jsonb, requested_by_actor_id uuid REFERENCES iam.actor(id),
 approved_by_actor_id uuid REFERENCES iam.actor(id), created_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL, applied_at timestamptz);
COMMIT;
