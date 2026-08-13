# AR-38 Cross-Module Verification Matrix

| Flow | Modules | Critical assertion |
|---|---|---|
| Home discovery | Web, Catalog, Editorial, Media | only public-eligible projections |
| Product detail | Catalog, Knowledge, Media, Commerce | facts/offers/media obey governance |
| Search | Search, Catalog, Editorial | bounded, relevant, no private drafts |
| Compare | Catalog, Web | canonical specs, missing values safe |
| Source ingestion | Sources, Ingestion, Knowledge | evidence precedes authority |
| AI enrichment | AI Hub, Knowledge, Audit | AI never self-promotes canonical truth |
| Editorial publish | Editorial, Media, Audit | publication state and rights enforced |
| Offer redirect | Commerce, Affiliate boundary | private params remain backend-only |
| Rights expiry | Media, Cache, Public API | expired asset disappears |
| Admin audit | IAM, Audit, Operations | capability gate + redaction |
| Provider outage | AI Hub, Operations | workload fallback is observable |
| Worker retry | Jobs, Outbox, DLQ | bounded retries and failure visibility |
| Deployment | CI/CD, DB, Runtime | exact staged digests promoted |
