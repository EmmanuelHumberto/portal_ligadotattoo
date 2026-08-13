# AR-37 Release Test Matrix

CI:
- clean install;
- lint/typecheck/unit;
- build all services;
- contract tests;
- migration verification;
- secret/SAST/dependency scans.

Deployment:
- staging uses immutable digests;
- migration failure blocks workloads;
- readiness blocks unhealthy rollout;
- smoke catches unavailable canonical routes;
- production promotion reuses staging digests.

Rollback:
- previous manifest redeploy;
- expand migration remains compatible;
- worker/outbox resume;
- compromised secret rotation independent of rollback.

Backup:
- scheduled backup;
- PITR capability;
- restore exercise;
- media restore does not bypass rights state.

Environment:
- no shared secrets;
- no production data in DEV by default;
- PROD has runtime-only secrets;
- bootstrap is idempotent.
