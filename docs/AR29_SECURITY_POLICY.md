# AR-29 Security and Policy

Provider credentials exist only in API/worker runtime secret stores. Database rows contain secret references, never secret values. Admin APIs expose provider/model metadata but never credentials.

Routing is workload-based. Domain modules depend on `AIProviderHubPort`; they do not import provider SDKs or provider-specific model identifiers.

External/source content is treated as untrusted prompt data. The hub adds a system boundary instructing models not to execute instructions found in acquired material. This complements, but does not replace, application-side authorization.

AI output does not acquire authority merely because a model produced it. Canonicalization and editorial publication policies from AR-26/AR-27 remain authoritative.

Fallback is ordered by `ai.workload_route.priority`. A failing provider/model can fall through to another enabled route. Circuit breaking is process-local in this baseline; distributed circuit state can later move to Redis/PostgreSQL if operational evidence requires it.

Cost estimates are telemetry and policy controls, not billing records. Provider invoices remain the financial source of truth.

Structured JSON parsing is enforced at the hub boundary. Domain-specific schema validation should additionally validate the parsed object before persistence.
