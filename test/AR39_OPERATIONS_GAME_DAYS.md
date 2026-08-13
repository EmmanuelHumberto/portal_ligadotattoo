# AR-39 Operations Game Days

Run controlled staging exercises:

1. AI primary provider outage -> fallback.
2. All AI providers unavailable -> graceful degradation.
3. Worker poison job -> dead letter and safe recovery.
4. Outbox backlog -> capacity recovery and drain.
5. Source ingestion dependency timeout -> bounded retry.
6. Media emergency takedown -> public/cache/CDN verification.
7. Leaked staging provider credential -> revoke/rotate.
8. Bad application release -> previous digest rollback.
9. Database unavailability -> readiness DOWN and recovery.
10. High public request burst -> rate controls without blocking normal smoke.

Record detection time, containment time, recovery time, missed telemetry and
runbook defects.
