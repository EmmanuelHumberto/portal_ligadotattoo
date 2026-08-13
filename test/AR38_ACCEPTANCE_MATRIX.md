# AR-38 Acceptance Matrix

P0:
- authorization isolation;
- secrets absent;
- SSRF regression;
- media takedown/expiry;
- migration integrity;
- rollback compatibility;
- database recovery posture;
- canonical governance cannot be bypassed.

P1:
- Home/catalog/product/search;
- Admin operations/audit;
- ingestion-to-public;
- AI primary/fallback;
- commerce freshness/redirect;
- worker/outbox processing;
- readiness/smoke;
- p95/error-rate load thresholds.

P2:
- non-critical visual defects;
- optional analytics completeness;
- minor editorial presentation issues.

GO requires all P0 and P1 pass.
P2 may support CONDITIONAL GO only with explicit ownership and deadline.
