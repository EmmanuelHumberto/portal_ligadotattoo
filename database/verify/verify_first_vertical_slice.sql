DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='catalog') THEN RAISE EXCEPTION 'catalog schema missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='knowledge' AND c.relname='canonical_fact') THEN RAISE EXCEPTION 'canonical_fact missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='knowledge' AND indexname='canonical_active_unique_idx') THEN RAISE EXCEPTION 'canonical active uniqueness missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='search' AND indexname='product_document_fts_idx') THEN RAISE EXCEPTION 'search FTS index missing'; END IF;
END $$;
SELECT 'AR-17 first vertical slice schema verification passed' AS result;
