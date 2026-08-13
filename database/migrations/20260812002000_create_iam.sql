BEGIN;
CREATE TABLE iam.actor (
 id uuid PRIMARY KEY, external_subject text NOT NULL UNIQUE, display_name text, email text,
 status text NOT NULL CHECK(status IN ('ACTIVE','SUSPENDED','DISABLED')), version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE iam.capability (key text PRIMARY KEY, description text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE iam.role (
 id uuid PRIMARY KEY, key text NOT NULL UNIQUE, name text NOT NULL, description text,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE iam.role_capability (
 role_id uuid NOT NULL REFERENCES iam.role(id) ON DELETE CASCADE,
 capability_key text NOT NULL REFERENCES iam.capability(key) ON DELETE CASCADE,
 PRIMARY KEY(role_id,capability_key));
CREATE TABLE iam.actor_role (
 actor_id uuid NOT NULL REFERENCES iam.actor(id) ON DELETE CASCADE,
 role_id uuid NOT NULL REFERENCES iam.role(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL, PRIMARY KEY(actor_id,role_id));
COMMIT;
