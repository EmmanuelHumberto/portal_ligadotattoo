# Module Ownership Map

| Module | Responsibility | Authority |
|---|---|---|
| IAM | authentication/capabilities/session boundaries | privileged access |
| Audit | immutable privileged action history | audit evidence |
| Catalog | products, brands, specifications | canonical product domain |
| Knowledge | claims, evidence, proposals, provenance | fact governance |
| Sources/Ingestion | acquisition and source runs | evidence only |
| AI Provider Hub | provider routing, fallback, execution records | no canonical authority |
| Editorial | news/blog/content lifecycle | editorial authority |
| Media | assets, variants, rights, takedown | public media eligibility |
| Commerce | listings, observations, redirects | offer eligibility |
| Search | public discovery projection | derived/public only |
| Jobs/Outbox | async execution and event delivery | operational |
| Operations | readiness, failures, DLQ/control plane | operational |
| Analytics | first-party product intelligence | derived/non-canonical |
| Web | public/Admin experience | presentation |
