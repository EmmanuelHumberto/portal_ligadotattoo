# AR-37 Observability & SLO Baseline

Signals:
- structured logs with correlation ID;
- HTTP request rate/error/latency;
- Web/API readiness;
- worker job throughput/retries/dead letters;
- outbox lag;
- ingestion success/failure;
- AI provider latency/fallback/cost;
- PostgreSQL connections/query latency;
- Core Web Vitals from AR-35.

Initial service objectives:
- public portal availability target: 99.9% monthly;
- API successful request availability target: 99.9% monthly;
- p95 public API latency target: < 500 ms excluding intentionally long external jobs;
- critical job/outbox backlog alert: oldest pending > 15 min;
- dead-letter growth alert;
- database storage/connection saturation alerts.

SLOs should be revised from measured production behavior, not silently relaxed to
fit regressions.
