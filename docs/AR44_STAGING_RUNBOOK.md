# Staging Deployment Runbook

1. Provision an isolated staging host/account/project.
2. Create staging PostgreSQL, Redis and object storage or use the supplied
   Compose topology for a controlled staging environment.
3. Copy `.env.staging.example` to `.env.staging`.
4. Replace every CHANGE_ME value using the staging secret store.
5. Configure only the AI providers intended for staging.
6. Set immutable Web/API/Worker image references and RELEASE_ID.
7. Run `scripts/staging-preflight.sh`.
8. Run AR-43 full verification against the assembled source repository.
9. Run `scripts/staging-deploy.sh`.
10. Verify API/Web health.
11. Run `scripts/staging-smoke.sh https://<staging-host>`.
12. Execute AR-38 E2E/security/performance scenarios.
13. Execute AI primary/fallback scenario.
14. Execute ingestion-to-public governance scenario.
15. Execute media rights/takedown scenario.
16. Capture evidence under the release ID.
17. Record defects; do not promote while P0/P1 gates are open.

Staging credentials must never be reused in production.
