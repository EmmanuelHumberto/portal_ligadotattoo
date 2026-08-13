BEGIN;
CREATE TABLE search.product_document (
 product_model_id uuid PRIMARY KEY REFERENCES catalog.product_model(id), slug text NOT NULL,
 manufacturer_name text NOT NULL, brand_name text, product_name text NOT NULL, product_type_key text NOT NULL,
 aliases text[] NOT NULL DEFAULT '{}', search_text text NOT NULL, canonical_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
 commercial_summary jsonb NOT NULL DEFAULT '{}'::jsonb, technical_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
 published boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL);
CREATE INDEX product_document_fts_idx ON search.product_document USING gin(to_tsvector('simple',search_text));
CREATE INDEX product_document_trgm_idx ON search.product_document USING gin(search_text gin_trgm_ops);
CREATE TABLE search.projection_checkpoint (
 projection_key text PRIMARY KEY, last_event_id uuid, last_occurred_at timestamptz, updated_at timestamptz NOT NULL);
COMMIT;
