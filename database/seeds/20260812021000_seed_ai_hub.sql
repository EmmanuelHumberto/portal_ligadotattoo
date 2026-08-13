BEGIN;
INSERT INTO ai.provider(id,key,display_name,provider_type,enabled,health_status,created_at,updated_at) VALUES
('00000000-0000-0000-0000-000000001001','openai','OpenAI','OPENAI',false,'DISABLED',now(),now()),
('00000000-0000-0000-0000-000000001002','anthropic','Anthropic','ANTHROPIC',false,'DISABLED',now(),now()),
('00000000-0000-0000-0000-000000001003','deepseek','DeepSeek','DEEPSEEK',false,'DISABLED',now(),now())
ON CONFLICT DO NOTHING;
INSERT INTO ai.workload(key,description,risk_class,created_at,updated_at) VALUES
('ARTICLE_CLASSIFICATION','Classify editorial candidates','LOW',now(),now()),
('EVENT_EXTRACTION','Extract structured event fields','MEDIUM',now(),now()),
('TECHNICAL_FIELD_EXTRACTION','Extract technical fields as candidates','MEDIUM',now(),now()),
('ENTITY_RESOLUTION_ASSIST','Assist ambiguous entity resolution','MEDIUM',now(),now()),
('EDITORIAL_DRAFT','Generate editorial draft for human review','MEDIUM',now(),now()),
('CHANGE_SUMMARY','Summarize detected source changes','LOW',now(),now()),
('EMBEDDING','Generate embeddings when enabled','LOW',now(),now())
ON CONFLICT DO NOTHING;
COMMIT;
