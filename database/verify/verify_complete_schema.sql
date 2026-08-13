DO $$
DECLARE s text;
BEGIN
 FOREACH s IN ARRAY ARRAY['iam','catalog','knowledge','media','source','ingestion','service','laboratory','commerce','editorial','search','ai','ops','audit']
 LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname=s) THEN RAISE EXCEPTION 'schema % missing',s; END IF;
 END LOOP;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='knowledge' AND indexname='canonical_active_unique_idx')
 THEN RAISE EXCEPTION 'canonical uniqueness missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM ai.provider WHERE key='openai') OR
    NOT EXISTS (SELECT 1 FROM ai.provider WHERE key='anthropic') OR
    NOT EXISTS (SELECT 1 FROM ai.provider WHERE key='deepseek')
 THEN RAISE EXCEPTION 'AI provider seeds missing'; END IF;
END $$;
SELECT 'AR-17 complete schema verification passed' AS result;
