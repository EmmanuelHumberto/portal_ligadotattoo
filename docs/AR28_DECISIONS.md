# AR-28 Decisions

The ingestion subsystem is source-registry driven rather than open-proxy driven.

Story discovery and catalog discovery are separate candidate paths. Acquisition itself does not create a Manufacturer, ProductModel, canonical fact, or published article.

Snapshots retain the acquired bytes so later extraction decisions are reproducible. SHA-256 deduplication prevents identical source bodies from creating repeated extraction work.

The scheduler must enforce source crawl delay and robots/compliance state before enqueueing acquisition.

## AR-20 API gap progress

Closed in AR-28:
- GET /admin/sources
- GET /admin/ingestion/runs

Additional:
- GET /admin/ingestion/discoveries

Remaining additive administrative reads:
- GET /admin/media
- GET /admin/listings
- GET /admin/ai/executions
- GET /admin/audit

## Next artifact

AR-29 — AI Provider Hub Runtime & Policy Engine.

Scope:
- provider registry;
- OpenAI/Anthropic/DeepSeek adapters;
- workload routing;
- model aliases;
- fallback chains;
- timeouts/retries/circuit breaker;
- budget/usage controls;
- secret isolation;
- structured output validation;
- execution observability;
- Admin provider/model configuration;
- GET /admin/ai/executions.
