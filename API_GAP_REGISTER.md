# AR-20 — API Additive Gap Register

AR-20 found administrative read contracts that are required for implementation but were not yet present in the AR-19 baseline.

Required additive endpoints:

- GET /admin/claims
- GET /admin/claims/{id}
- GET /admin/canonical-proposals
- GET /admin/canonical-proposals/{id}
- GET /admin/media
- GET /admin/sources
- GET /admin/ingestion/runs
- GET /admin/editorial
- GET /admin/editorial/{id}
- GET /admin/listings
- GET /admin/ai/executions
- GET /admin/audit

These are not breaking changes. They must be added to OpenAPI before full Admin implementation.
