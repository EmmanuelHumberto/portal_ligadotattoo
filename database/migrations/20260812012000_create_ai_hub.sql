BEGIN;
CREATE TABLE ai.provider (
 id uuid PRIMARY KEY, key text NOT NULL UNIQUE, display_name text NOT NULL, provider_type text NOT NULL,
 enabled boolean NOT NULL DEFAULT false, base_endpoint text, secret_reference text,
 health_status text NOT NULL CHECK(health_status IN ('UNKNOWN','HEALTHY','DEGRADED','UNAVAILABLE','DISABLED')),
 configuration jsonb NOT NULL DEFAULT '{}'::jsonb, version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE ai.model (
 id uuid PRIMARY KEY, provider_id uuid NOT NULL REFERENCES ai.provider(id), model_key text NOT NULL,
 display_name text, enabled boolean NOT NULL DEFAULT true, capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
 cost_metadata jsonb NOT NULL DEFAULT '{}'::jsonb, context_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, UNIQUE(provider_id,model_key));
CREATE TABLE ai.workload (
 key text PRIMARY KEY, description text NOT NULL, risk_class text NOT NULL, output_schema_ref text,
 enabled boolean NOT NULL DEFAULT true, configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE ai.routing_policy (
 id uuid PRIMARY KEY, workload_key text NOT NULL REFERENCES ai.workload(key), name text NOT NULL,
 enabled boolean NOT NULL DEFAULT true, budget_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 retry_policy jsonb NOT NULL DEFAULT '{}'::jsonb, version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE ai.routing_candidate (
 routing_policy_id uuid NOT NULL REFERENCES ai.routing_policy(id), provider_id uuid NOT NULL REFERENCES ai.provider(id),
 model_id uuid NOT NULL REFERENCES ai.model(id), priority integer NOT NULL, enabled boolean NOT NULL DEFAULT true,
 configuration jsonb NOT NULL DEFAULT '{}'::jsonb, PRIMARY KEY(routing_policy_id,provider_id,model_id));
CREATE TABLE ai.execution (
 id uuid PRIMARY KEY, workload_key text NOT NULL REFERENCES ai.workload(key), provider_id uuid REFERENCES ai.provider(id),
 model_id uuid REFERENCES ai.model(id), status text NOT NULL CHECK(status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','DEFERRED','REJECTED')),
 input_reference text, output_reference text, input_hash text, usage_json jsonb, cost_amount numeric(18,8),
 cost_currency char(3), latency_ms integer, fallback_count integer NOT NULL DEFAULT 0 CHECK(fallback_count>=0),
 correlation_id uuid, started_at timestamptz NOT NULL, completed_at timestamptz, error_code text);
CREATE INDEX ai_execution_workload_time_idx ON ai.execution(workload_key,started_at DESC);
COMMIT;
