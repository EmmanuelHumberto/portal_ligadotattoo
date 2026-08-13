# AR-24 Decisions

1. Admin API is authenticated by default; public endpoints require explicit `@Public()`.
2. OIDC verification is a deployment adapter and must validate signature, issuer, audience and expiration.
3. Capabilities are enforced by backend guards; UI visibility is not security.
4. Audit records are append-only.
5. Outbox dispatcher uses `FOR UPDATE SKIP LOCKED`.
6. Job reservation uses `FOR UPDATE SKIP LOCKED`.
7. Jobs terminate in `DEAD` after max attempts or non-retryable failure.
8. Retry uses bounded exponential backoff.
9. ProductModel is a domain aggregate independent from NestJS.
10. Catalog mutations use optimistic concurrency where existing aggregates are modified.
11. Product creation emits an outbox event in the same transaction.
12. No AI provider SDK or credential is present in this slice.

## Known implementation gates

- Wire a concrete OIDC/JWKS verifier before any admin deployment.
- Bind Catalog read query services to the PostgreSQL pool.
- Merge AR-23 CatalogModule providers/controllers with the AR-24 additions.
- Execute integration tests against the AR-17+AR-24 PostgreSQL schema.

## Next artifact

AR-25 — Catalog Read Model, Public Product API, Media Foundation & Search Projection.

This will complete the first public product vertical:
Catalog -> Media -> canonical-ready public DTO -> search document -> public endpoints.
