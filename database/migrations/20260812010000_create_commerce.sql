BEGIN;
CREATE TABLE commerce.seller (
 id uuid PRIMARY KEY, name text NOT NULL, normalized_name text NOT NULL, website text, country_code char(2),
 status text NOT NULL, version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX seller_name_trgm_idx ON commerce.seller USING gin(normalized_name gin_trgm_ops);
CREATE TABLE commerce.marketplace (
 id uuid PRIMARY KEY, name text NOT NULL, base_url text, country_code char(2), status text NOT NULL,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE commerce.listing (
 id uuid PRIMARY KEY, seller_id uuid NOT NULL REFERENCES commerce.seller(id),
 marketplace_id uuid REFERENCES commerce.marketplace(id), product_model_id uuid REFERENCES catalog.product_model(id),
 product_variant_id uuid REFERENCES catalog.product_variant(id), source_id uuid REFERENCES source.source(id),
 external_listing_id text, url text NOT NULL, title text NOT NULL, currency char(3), status text NOT NULL,
 last_observed_at timestamptz, version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX listing_product_idx ON commerce.listing(product_model_id);
CREATE TABLE commerce.listing_claim (
 id uuid PRIMARY KEY, listing_id uuid NOT NULL REFERENCES commerce.listing(id),
 claim_id uuid NOT NULL REFERENCES knowledge.claim(id), created_at timestamptz NOT NULL, UNIQUE(listing_id,claim_id));
CREATE TABLE commerce.price_observation (
 id uuid PRIMARY KEY, listing_id uuid NOT NULL REFERENCES commerce.listing(id),
 amount numeric(18,4) NOT NULL CHECK(amount>=0), currency char(3) NOT NULL, availability text,
 shipping_amount numeric(18,4) CHECK(shipping_amount IS NULL OR shipping_amount>=0),
 observed_at timestamptz NOT NULL, snapshot_id uuid REFERENCES ingestion.snapshot(id), created_at timestamptz NOT NULL);
CREATE INDEX price_listing_time_idx ON commerce.price_observation(listing_id,observed_at DESC);
CREATE TABLE commerce.offer_projection (
 listing_id uuid PRIMARY KEY REFERENCES commerce.listing(id), product_model_id uuid NOT NULL,
 seller_id uuid NOT NULL, current_amount numeric(18,4), currency char(3), availability text,
 observed_at timestamptz, price_change_30d numeric(12,6), price_change_90d numeric(12,6), updated_at timestamptz NOT NULL);
COMMIT;
