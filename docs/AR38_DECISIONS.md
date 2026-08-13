# AR-38 Decisions

1. Release readiness is evidence-based, not artifact-count based.
2. The exact immutable staging candidate must be promoted to production.
3. Critical journeys are tested across module boundaries.
4. AI fallback is a release scenario, not only a unit-test concern.
5. Ingestion cannot reach canonical/public authority without governance.
6. Media rights/takedown behavior is P0.
7. Admin authorization bypass is automatic NO-GO.
8. Security regression runs against exact candidate digests.
9. Performance is tested with representative sustained load.
10. Migration rehearsal includes application rollback compatibility.
11. Missing required evidence is not treated as PASS.
12. CONDITIONAL GO cannot waive security, integrity or authority controls.
13. Release decision and deployment execution remain separate operations.
14. Rollback target is identified before launch.
15. Production launch requires operational ownership and monitoring.

## Next artifact

AR-39 — Production Operations, Incident Response & Post-Launch Control Plane.

Scope:
- incident severity model;
- on-call/runbooks;
- SLO/error-budget operations;
- provider outage playbooks;
- ingestion/queue recovery;
- media takedown emergency procedure;
- security incident response;
- release rollback triggers;
- post-launch dashboards;
- daily/weekly operational review;
- launch stabilization window.
