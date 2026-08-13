BEGIN;
CREATE TABLE media.asset (
 id uuid PRIMARY KEY, kind text NOT NULL, storage_key_original text NOT NULL, mime_type text NOT NULL,
 byte_size bigint NOT NULL CHECK(byte_size>=0), sha256 text NOT NULL UNIQUE, width integer, height integer,
 duration_ms bigint, rights_status text NOT NULL CHECK(rights_status IN ('UNKNOWN','PENDING','PERMITTED','RESTRICTED','EXPIRED','TAKEDOWN')),
 attribution_text text, source_url text, status text NOT NULL CHECK(status IN ('PROCESSING','READY','FAILED','HIDDEN')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE media.rendition (
 id uuid PRIMARY KEY, asset_id uuid NOT NULL REFERENCES media.asset(id), rendition_key text NOT NULL,
 storage_key text NOT NULL, mime_type text NOT NULL, width integer, height integer, byte_size bigint NOT NULL,
 created_at timestamptz NOT NULL, UNIQUE(asset_id,rendition_key));
CREATE TABLE media.asset_link (
 id uuid PRIMARY KEY, asset_id uuid NOT NULL REFERENCES media.asset(id), subject_type text NOT NULL,
 subject_id uuid NOT NULL, role text NOT NULL, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL);
CREATE INDEX asset_link_subject_idx ON media.asset_link(subject_type,subject_id,role);
COMMIT;
