# AR-44 Decisions

1. Staging is isolated from production.
2. Staging uses HTTPS and runtime-only secrets.
3. AI providers are configured by references, not embedded credentials.
4. Migration precedes bootstrap and workload startup.
5. Bootstrap/seed is idempotent and contains no production secrets.
6. AI provider outage does not fail core liveness.
7. Application rollback does not automatically reverse schema.
8. Release evidence is keyed by immutable release ID/artifacts.
9. P0/P1 verification remains mandatory before promotion.
10. AR-45 is the final formulation/acceptance artifact.

## Next
AR-45 — Final Acceptance & Master Release.
