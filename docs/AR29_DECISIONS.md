# AR-29 Decisions

The AI layer is now an executable Provider Hub rather than direct OpenAI integration.

OpenAI, Anthropic and DeepSeek are initial adapters, not privileged architectural dependencies. New providers can be added by implementing `AIProviderAdapter` and registering models/routes.

Provider model IDs are configuration. Workloads reference routing policy, not hard-coded models.

AR-20 administrative gap closed:
- GET /admin/ai/executions

Also added:
- GET /admin/ai/registry

Remaining administrative GET gaps:
- GET /admin/media
- GET /admin/listings
- GET /admin/audit

## Production gates

Before production:
- replace environment-only secret resolver with deployment secret manager where available;
- configure actual provider model rows and routes;
- validate provider request/response formats against current provider APIs;
- add domain JSON schemas;
- add per-tenant/global daily budget accounting if multi-tenant billing is introduced;
- verify egress allowlists at infrastructure level.

## Next artifact

AR-30 — Commerce Listings, Price Intelligence & Affiliate Boundary.

Scope:
- sellers;
- listings;
- price observations;
- normalization;
- affiliate link boundary;
- freshness/staleness;
- price trend projection;
- Admin listings GET;
- public offers hardening;
- ingestion-to-listing candidate flow;
- audit/outbox.
