BEGIN;
CREATE TABLE catalog.manufacturer (
 id uuid PRIMARY KEY, name text NOT NULL, normalized_name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
 official_website text, country_code char(2), status text NOT NULL CHECK(status IN ('ACTIVE','INACTIVE','UNKNOWN')),
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX manufacturer_name_trgm_idx ON catalog.manufacturer USING gin(normalized_name gin_trgm_ops);
CREATE TABLE catalog.brand (
 id uuid PRIMARY KEY, manufacturer_id uuid REFERENCES catalog.manufacturer(id), name text NOT NULL,
 normalized_name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE, official_website text, status text NOT NULL,
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE catalog.product_type (
 key text PRIMARY KEY, name text NOT NULL, description text, parent_key text REFERENCES catalog.product_type(key),
 sort_order integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true);
CREATE TABLE catalog.product_model (
 id uuid PRIMARY KEY, manufacturer_id uuid NOT NULL REFERENCES catalog.manufacturer(id),
 brand_id uuid REFERENCES catalog.brand(id), product_type_key text NOT NULL REFERENCES catalog.product_type(key),
 name text NOT NULL, normalized_name text NOT NULL, slug text NOT NULL UNIQUE, model_code text,
 lifecycle text NOT NULL CHECK(lifecycle IN ('ANNOUNCED','ACTIVE','DISCONTINUED','LEGACY','UNKNOWN')),
 release_date date, discontinued_date date, version bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX product_name_trgm_idx ON catalog.product_model USING gin(normalized_name gin_trgm_ops);
CREATE TABLE catalog.product_variant (
 id uuid PRIMARY KEY, product_model_id uuid NOT NULL REFERENCES catalog.product_model(id), name text NOT NULL,
 normalized_name text NOT NULL, sku text, manufacturer_variant_code text, status text NOT NULL,
 version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE catalog.product_alias (
 id uuid PRIMARY KEY, product_model_id uuid NOT NULL REFERENCES catalog.product_model(id),
 alias text NOT NULL, normalized_alias text NOT NULL, alias_type text NOT NULL, source_note text,
 created_at timestamptz NOT NULL, UNIQUE(product_model_id,normalized_alias));
CREATE INDEX product_alias_trgm_idx ON catalog.product_alias USING gin(normalized_alias gin_trgm_ops);
COMMIT;
