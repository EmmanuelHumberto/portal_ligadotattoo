BEGIN;
CREATE TABLE ops.outbox_event (
 event_id uuid PRIMARY KEY, event_type text NOT NULL, event_version integer NOT NULL CHECK(event_version>0),
 aggregate_type text NOT NULL, aggregate_id text NOT NULL, payload jsonb NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL,
 available_at timestamptz NOT NULL, status text NOT NULL CHECK(status IN ('PENDING','PROCESSING','PUBLISHED','FAILED')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0), locked_at timestamptz, locked_by text,
 published_at timestamptz, last_error text);
CREATE INDEX outbox_pending_idx ON ops.outbox_event(status,available_at,occurred_at);
CREATE TABLE ops.job (
 id uuid PRIMARY KEY, queue text NOT NULL, type text NOT NULL, version integer NOT NULL CHECK(version>0),
 payload jsonb NOT NULL, priority integer NOT NULL DEFAULT 0, status text NOT NULL
 CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED','DEAD_LETTER')),
 run_after timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 max_attempts integer NOT NULL CHECK(max_attempts>0), locked_at timestamptz, locked_by text,
 lease_expires_at timestamptz, correlation_id uuid, created_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL, last_error text);
CREATE INDEX job_pending_idx ON ops.job(queue,status,run_after,priority DESC,created_at) WHERE status='PENDING';
CREATE TABLE ops.idempotency_record (
 id uuid PRIMARY KEY, scope text NOT NULL, idempotency_key text NOT NULL, request_hash text NOT NULL,
 status text NOT NULL, response_code integer, response_body jsonb, resource_type text, resource_id text,
 created_at timestamptz NOT NULL, expires_at timestamptz, UNIQUE(scope,idempotency_key));
CREATE TABLE audit.audit_log (
 id uuid PRIMARY KEY, actor_id text NOT NULL, actor_type text NOT NULL, action text NOT NULL,
 resource_type text NOT NULL, resource_id text NOT NULL, reason text, safe_diff jsonb,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, correlation_id uuid, created_at timestamptz NOT NULL);
CREATE INDEX audit_resource_idx ON audit.audit_log(resource_type,resource_id,created_at DESC);
COMMIT;
