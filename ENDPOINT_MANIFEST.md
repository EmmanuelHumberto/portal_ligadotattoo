# Endpoint Manifest

## Public
- `GET /public/products`
- `GET /public/products/{slug}`
- `GET /public/search`
- `GET /public/search/suggest`
- `GET /public/editorial`
- `GET /public/editorial/{slug}`
- `GET /public/products/{slug}/offers`
- `GET /public/products/{slug}/price-history`

## Admin
- `GET /admin/me`
- `GET|POST /admin/manufacturers`
- `GET|POST /admin/products`
- `GET /admin/products/{id}`
- `POST /admin/products/{id}/image`
- `POST /admin/products/{id}/specs`
- `GET /admin/claims`
- `GET /admin/claims/{id}`
- `POST /admin/claims`
- `GET /admin/canonical-proposals`
- `GET /admin/canonical-proposals/{id}`
- `POST /admin/canonical-proposals`
- `POST /admin/canonical-proposals/{id}/decision`
- `GET /admin/media`
- `POST /admin/media`
- `POST /admin/media/{id}/rights`
- `GET /admin/media/{id}/url`
- `GET /admin/sources`
- `POST /admin/sources`
- `GET /admin/ingestion/runs`
- `POST /admin/ingestion/acquisitions`
- `GET /admin/editorial`
- `GET /admin/editorial/{id}`
- `POST /admin/editorial`
- `POST /admin/editorial/{id}/publish`
- `POST /admin/editorial/{id}/unpublish`
- `DELETE /admin/editorial/{id}`
- `POST /admin/listings/{id}/prices`
- `POST /admin/listings/{id}/url`
- `GET /admin/ai/providers`
- `GET /admin/ai/executions`
- `POST /admin/ai/routing-policies`
- `GET /admin/audit`
- `GET /admin/technical-issues`
- `GET /admin/laboratory/sessions`

This is the v1 implementation baseline. Additional detail endpoints can be added compatibly without changing the architectural contract.
