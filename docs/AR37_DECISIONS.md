# AR-37 Decisions

1. DEV, STAGING and PROD are isolated environments.
2. Production promotes the exact image digests validated in staging.
3. Web, API and Worker are independent immutable artifacts.
4. Database migrations run before workload promotion through a dedicated job.
5. Schema evolution follows expand/contract.
6. Failed migration blocks deployment.
7. Rolling deployment requires readiness probes.
8. Application rollback reuses the previous release manifest.
9. Database rollback is restore/recovery-driven, not automatic reverse SQL.
10. Production backups require periodic restore verification.
11. Observability includes HTTP, jobs, outbox, ingestion, AI, DB and Web Vitals.
12. Bootstrap never contains secrets or hard-coded privileged passwords.
13. CI includes tests, build, migrations, contracts and security gates.
14. Release manifests bind Git SHA, image digests and migration set.
15. Production promotion is explicit and approval-gated.

## Next artifact

AR-38 — End-to-End Verification, Release Candidate & Launch Readiness.

Scope:
- cross-module integration matrix;
- critical user journeys;
- Admin journeys;
- provider fallback tests;
- ingestion-to-public flow;
- commerce/media rights scenarios;
- migration rehearsal;
- load/performance verification;
- security regression;
- release-candidate evidence pack;
- go/no-go launch decision framework.
