# AR-25 Decisions

1. Public product reads use dedicated query services, not aggregates.
2. Public specifications are sourced exclusively from current `canonical_fact`.
3. Claims are not joined into public product DTOs.
4. Media is public only when `status=ACTIVE` and `rights_status=PERMITTED`.
5. Search is projection-based and not a transactional aggregate query.
6. Search projection is asynchronously updated through jobs.
7. PostgreSQL full-text search is the baseline; an external search engine can replace the adapter later.
8. Search URLs point to canonical portal routes.
9. Offers show observation timestamps.
10. Price history is derived from immutable observations.
11. Public APIs are explicitly marked public; Admin remains authenticated by default.
12. Product detail loads canonical facts, media and offer summary independently.
13. Public media URL is a delivery URL, never an object-storage credential.
14. Search suggestion requires at least two characters.
15. Cursor pagination is the baseline.

## Integration notes

AR-25 controllers/providers must be merged into the application modules:
- `PublicCatalogController`
- `PublicCommerceController`
- `PublicSearchController`
- `MediaController`
- corresponding query/repository providers.

The exact canonical_fact columns should be aligned with the AR-17 database baseline during merge. If AR-17 names differ, adapt the repository/query mapping rather than changing the domain contract.

## Next artifact

AR-26 — Knowledge Canonicalization Executable Slice.

Scope:
- Claim write/read;
- evidence linkage;
- canonical proposal queue;
- human decision;
- immutable canonical history;
- audit/outbox;
- public canonical projection invalidation;
- conflict handling;
- integration tests.
