# AR-23 Foundation Decisions

1. NestJS API and worker remain separate processes.
2. PostgreSQL transactions are explicit through `TransactionManager`.
3. Outbox writes occur in the same transaction as aggregate state changes.
4. Health endpoints stay outside `/api/v1`.
5. Problem Details is the standard error envelope.
6. Catalog/Manufacturer is the first executable vertical slice.
7. Domain object does not depend on NestJS.
8. PostgreSQL repository maps rows into domain objects.
9. Slug uniqueness is checked in application and must remain protected by DB constraint.
10. Authentication/capability guards are the next security integration; this scaffold must not be exposed publicly before they are wired.
11. Worker execution, leases, retry/backoff and dead-letter processing are scaffolded for the next implementation step.
12. AI Provider Hub is not invoked in this foundation slice; provider credentials remain backend-only.

## Next artifact

AR-24 — IAM, Authorization, Outbox/Job Worker Runtime & Catalog Completion.

It should implement:
- OIDC/JWT authentication;
- ActorContext;
- capability guards;
- audit repository;
- outbox dispatcher;
- job reservation/retry/dead-letter;
- Manufacturer update/status;
- ProductModel aggregate and endpoints;
- integration tests against PostgreSQL.
