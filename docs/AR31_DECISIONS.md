# AR-31 Decisions

1. Media binary storage and public delivery are ports, not domain dependencies.
2. Rights history is append-only; only one rights record is current.
3. `PERMITTED` requires an explicit rights basis.
4. Rights expiry automatically removes public eligibility.
5. Public media DTOs never expose storage credentials or private storage paths.
6. Image variants are worker-generated and replaceable by infrastructure-specific processing.
7. Alt text and attribution are first-class metadata.
8. Media linked to editorial/catalog remains governed centrally.
9. Public delivery requires ACTIVE + PERMITTED + non-expired rights.
10. Rights decisions are audited and emitted through Outbox.
11. Cache invalidation follows rights changes and expiry.
12. Original media remains separate from derived variants.

AR-20 administrative gap closed:
- GET /admin/media

Remaining additive administrative read gap:
- GET /admin/audit

## Next artifact

AR-32 — Audit Explorer, Operations Console & Administrative Closure.

Scope:
- GET /admin/audit;
- audit filters/detail;
- job/outbox/dead-letter operational reads;
- system health/readiness model;
- cache invalidation visibility;
- AI/ingestion operational summary;
- security-sensitive redaction;
- Admin dashboard projection;
- closure of the additive Admin API inventory.
