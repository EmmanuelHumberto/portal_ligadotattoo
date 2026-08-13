# AR-27 Decisions

1. Editorial content uses a typed block document, not arbitrary HTML.
2. AI drafts are suggestions and remain editable.
3. Human review/approval is the baseline authority.
4. Automatic direct publication remains disabled by default.
5. Publication requires allowed media rights.
6. Editorial content cannot mutate canonical knowledge.
7. AI execution provenance is stored internally.
8. Public content exposes published material only.
9. News, Blog, Technical Article, Event and Notice share infrastructure.
10. Event-specific facts live in a dedicated extension table.
11. Publication emits Outbox events.
12. Publication refreshes search/cache projections asynchronously.
13. Scheduled publication runs through worker jobs.
14. Editorial workflow uses optimistic concurrency.
15. Approval requires a human reason.
16. Search projection maps content type to canonical portal route.
17. Source attribution is persisted independently from body blocks.
18. Product relationships are explicit records.
19. Media relationships are explicit and rights-checked.
20. Provider Hub is accessed through a port; editorial code is provider-neutral.

## AR-20 API gap progress

Closed here:
- GET /admin/editorial

Still pending in their domain slices:
- GET /admin/media
- GET /admin/sources
- GET /admin/ingestion/runs
- GET /admin/listings
- GET /admin/ai/executions
- GET /admin/audit

## Next artifact

AR-28 — Source Registry, Secure Ingestion & Story Discovery Executable Slice.

Scope:
- source registry;
- crawl targets;
- robots/compliance policy metadata;
- HTTP acquisition boundary;
- SSRF protection;
- snapshots;
- deduplication;
- extraction jobs;
- editorial candidate creation;
- manufacturer/product discovery candidates;
- ingestion observability and Admin read APIs.
