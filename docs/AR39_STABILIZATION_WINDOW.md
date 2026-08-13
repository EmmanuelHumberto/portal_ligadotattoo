# Launch Stabilization Window

Recommended baseline: first 72 hours after initial production launch.

During this window:
- heightened dashboards/alerts;
- named operational owner each coverage period;
- no unrelated risky migrations;
- tighter release approval;
- daily review of errors, latency, queues, AI providers, ingestion freshness,
  media rights events, affiliate redirects and Core Web Vitals;
- track user-facing defects separately from security/integrity incidents.

Exit criteria:
- no unresolved SEV-1/SEV-2;
- error/latency within agreed operating range;
- queues/outbox stable;
- provider fallback exercised or verified;
- no unexplained rights/publication anomalies;
- backup/monitoring remain healthy.
