# AR-38 Production Release Rehearsal

Run in staging with production candidate digests.

1. Capture release manifest.
2. Restore a recent staging backup into isolated rehearsal database.
3. Apply complete pending migration set.
4. Start API/Web/Worker with candidate digests.
5. Execute bootstrap idempotency check.
6. Run smoke and critical E2E.
7. Execute controlled ingestion-to-public scenario.
8. Exercise primary AI provider and fallback.
9. Exercise media rights expiry/takedown.
10. Exercise fresh/stale commerce offers and redirect.
11. Run security regression.
12. Run representative load test.
13. Inspect queues/outbox/dead letters after load.
14. Roll application back to previous digests.
15. Verify previous application remains compatible with expand-stage schema.
16. Redeploy candidate and repeat smoke.
17. Record measured timings, failures and operator actions.

Any manual undocumented step discovered becomes a runbook defect.
