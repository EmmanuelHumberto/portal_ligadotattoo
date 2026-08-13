# AR-32 Decisions

1. Audit is immutable and read-only through the Explorer.
2. Audit metadata is recursively redacted before Admin delivery.
3. Operations lists avoid raw payload exposure by default.
4. Dead letters are explicit operational records.
5. Readiness distinguishes UP, DEGRADED and DOWN.
6. Backlog thresholds are baseline configuration candidates, not permanent constants.
7. Dashboard aggregates the last 24h for volatile execution systems.
8. Audit and operations use separate capabilities.
9. Admin API inventory from AR-20 is now closed.
10. Operational visibility does not grant mutation/requeue authority automatically.

## Next artifact

AR-33 — Premium Dark Portal Experience & Frontend Integration.

Scope:
- sophisticated dark visual system;
- responsive navigation;
- high-impact card language;
- home/discovery composition;
- product detail experience;
- editorial/news/event surfaces;
- search experience;
- price/offers visualization;
- media galleries;
- trust/provenance presentation;
- Admin visual shell;
- loading/error/empty states;
- accessibility/performance budgets;
- integration against the stabilized APIs.
