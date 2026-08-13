# Environment Topology

DEV
- local Compose;
- synthetic/dev data;
- provider sandbox/test keys where available;
- no production data copy by default.

STAGING
- production-like topology at smaller scale;
- separate database, object storage, cache and secrets;
- same immutable images intended for production;
- smoke, migration and integration validation;
- external integrations use staging/sandbox accounts where available.

PROD
- isolated namespace/account/project;
- managed PostgreSQL recommended;
- encrypted object storage;
- CDN/edge TLS/WAF;
- runtime secret manager;
- Web/API/Worker independently scalable;
- backups, monitoring, alerting and audit retention enabled.

Never share database credentials, signing keys or provider secrets across
environments.
