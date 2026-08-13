# AR-44 Staging Test Matrix

Preflight:
- missing required secret fails;
- short session secret fails;
- non-HTTPS site URL fails;
- immutable image references present.

Deployment:
- clean migration;
- repeated bootstrap;
- API readiness;
- Web health;
- Worker heartbeat;
- public smoke.

AI:
- each enabled provider;
- primary/fallback;
- all providers unavailable;
- no secret leakage;
- no automatic canonical promotion.

Recovery:
- application rollback;
- queue resumes;
- previous schema compatibility;
- media takedown propagation.

Evidence:
- release ID and image references recorded;
- unexecuted checks remain PENDING.
