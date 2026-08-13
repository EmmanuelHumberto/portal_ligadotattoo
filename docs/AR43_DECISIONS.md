# AR-43 Decisions

1. Build validity is evidence-based.
2. Provider-specific HTTP semantics stay inside adapters.
3. Provider fallback is centralized.
4. Web has no provider credential dependency.
5. Worker lifecycle is explicit and processor-oriented.
6. Migration ordering has a machine-checkable gate.
7. Dockerfiles build from monorepo root context.
8. Static architecture checks supplement, not replace, tests.
9. CI executes migrations before the full verification command.
10. Unexecuted validation is reported as pending, never as success.

## Next
AR-44 — Staging-Ready Distribution.
