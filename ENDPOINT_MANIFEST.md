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
- `GET|PATCH /admin/products/{id}`
- `POST /admin/claims`
- `POST /admin/canonical-proposals`
- `POST /admin/canonical-proposals/{id}/decision`
- `POST /admin/media`
- `POST /admin/media/{id}/rights`
- `POST /admin/sources`
- `POST /admin/ingestion/acquisitions`
- `POST /admin/editorial`
- `POST /admin/editorial/{id}/publish`
- `POST /admin/listings/{id}/prices`
- `GET /admin/ai/providers`
- `POST /admin/ai/routing-policies`

This is the v1 implementation baseline. Additional detail endpoints can be added compatibly without changing the architectural contract.
