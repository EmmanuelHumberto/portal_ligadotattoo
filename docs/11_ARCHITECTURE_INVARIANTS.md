# Architecture Invariants

INV-01 External acquisition produces evidence before authority.
INV-02 AI output cannot directly become canonical truth.
INV-03 AI credentials remain backend-only.
INV-04 AI provider selection is configuration/workload driven.
INV-05 Public DTOs expose only eligible projections.
INV-06 Media rights state can immediately revoke public eligibility.
INV-07 Commerce redirect secrets/private parameters remain server-side.
INV-08 Privileged operations require capabilities and auditability.
INV-09 Dynamic server URL fetching uses SSRF-safe infrastructure; Worker
ingestion network access passes exclusively through `HttpAcquirer`.
INV-10 Async processing is idempotent and observable.
INV-11 Release artifacts are immutable and promoted by digest.
INV-12 Production schema evolution is backward-compatible during rollout.
INV-13 Analytics is allowlisted, first-party and non-invasive.
INV-14 Security/integrity/rights cannot be waived by growth experiments.
INV-15 Operational incidents preserve evidence and use explicit ownership.
