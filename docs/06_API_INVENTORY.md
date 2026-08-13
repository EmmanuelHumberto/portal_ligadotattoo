# API Inventory

Representative public boundaries:
- GET /public/products
- GET /public/products/facets
- GET /public/products/:slug
- GET /public/products/compare
- GET /public/search/suggest
- GET /public/seo/products
- GET /public/seo/editorial
- GET /public/seo/events
- GET /go/listing/:id
- POST /analytics/events
- health/readiness endpoints

Representative Admin boundaries:
- /admin/audit
- /admin/operations/*
- /admin/media/*
- /admin/ai/*
- /admin/intelligence/*
- catalog/knowledge/source/editorial/commerce management endpoints.

API rules:
- public DTOs are projections, not raw persistence models;
- Admin routes require explicit capabilities;
- writes are audited where privileged/domain-significant;
- browser-cookie mutations require CSRF/origin validation;
- endpoint classes have distinct quotas;
- secrets and storage/provider credentials are never serialized to public DTOs.
