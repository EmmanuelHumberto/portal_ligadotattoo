# System Context

Users:
- public visitor;
- editorial/catalog operator;
- privileged administrator;
- operations/security engineer.

Primary runtime:
- Web: public portal + Admin UI;
- API: domain/application services and public/Admin APIs;
- Worker: ingestion, AI, media, outbox and asynchronous jobs;
- PostgreSQL: canonical data, evidence, audit, operations and analytics;
- Object storage/CDN: governed media delivery;
- external sources: controlled acquisition targets;
- AI providers: OpenAI, Anthropic, DeepSeek and future configured providers;
- commerce destinations: sellers/affiliate targets;
- observability stack: logs, metrics, alerts and traces/correlation.

Trust direction:

External sources -> Ingestion/Evidence -> Proposal/Review -> Canonical Data
                                                    |
                                                    v
                                            Public Projection
                                                    |
                                                    v
                                                  Web

AI providers participate in enrichment/reasoning workloads but do not sit on the
canonical-authority path.
