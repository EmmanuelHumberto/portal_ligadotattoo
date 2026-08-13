create schema if not exists ai;

-- AI runtime tables are introduced after editorial creates ai.execution.
-- Keeping this migration schema-only avoids conflicting table shapes between
-- the AR-42 baseline and the AR-29 executable provider registry.
