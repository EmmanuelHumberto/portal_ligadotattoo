# Deployment & Operations

Environments:
DEV -> STAGING -> PROD, isolated credentials/data/services.

Release:
commit -> CI -> immutable Web/API/Worker images -> staging migration/deploy ->
AR-38 evidence -> approval -> promote exact digests -> production smoke ->
stabilization.

Database:
expand -> transition/backfill -> contract in later release.

Rollback:
redeploy previous healthy application digests when schema remains compatible.
Database corruption uses recovery/restore procedures, not guessed reverse SQL.

Production operations:
- SLO/error-budget;
- SEV-1..SEV-4;
- incident command;
- AI provider outage playbook;
- queue/outbox/ingestion recovery;
- emergency media takedown;
- security response;
- first 72-hour launch stabilization baseline.
