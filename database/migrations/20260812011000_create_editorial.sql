BEGIN;
CREATE TABLE editorial.content (
 id uuid PRIMARY KEY, content_type text NOT NULL CHECK(content_type IN ('NEWS','BLOG','EVENT','TECHNICAL_ARTICLE','NOTICE')),
 slug text NOT NULL UNIQUE, title text NOT NULL, subtitle text, summary text, body_document jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED','REJECTED')),
 author_actor_id uuid REFERENCES iam.actor(id), reviewer_actor_id uuid REFERENCES iam.actor(id),
 publisher_actor_id uuid REFERENCES iam.actor(id), scheduled_at timestamptz, published_at timestamptz,
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX editorial_published_idx ON editorial.content(content_type,published_at DESC) WHERE status='PUBLISHED';
CREATE TABLE editorial.content_source (
 id uuid PRIMARY KEY, content_id uuid NOT NULL REFERENCES editorial.content(id),
 source_id uuid REFERENCES source.source(id), snapshot_id uuid REFERENCES ingestion.snapshot(id),
 source_url text, relation_type text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE editorial.content_product (
 content_id uuid NOT NULL REFERENCES editorial.content(id), product_model_id uuid NOT NULL REFERENCES catalog.product_model(id),
 relation_type text NOT NULL, PRIMARY KEY(content_id,product_model_id,relation_type));
CREATE TABLE editorial.event_detail (
 content_id uuid PRIMARY KEY REFERENCES editorial.content(id), event_name text NOT NULL,
 starts_at timestamptz, ends_at timestamptz, timezone text, venue_name text, city text, region text,
 country_code char(2), official_url text,
 status text NOT NULL CHECK(status IN ('SCHEDULED','POSTPONED','CANCELLED','COMPLETED','UNKNOWN')));
CREATE TABLE editorial.revision (
 id uuid PRIMARY KEY, content_id uuid NOT NULL REFERENCES editorial.content(id), revision_number integer NOT NULL,
 body_document jsonb NOT NULL, title text NOT NULL, summary text, actor_id uuid REFERENCES iam.actor(id),
 created_at timestamptz NOT NULL, UNIQUE(content_id,revision_number));
COMMIT;
