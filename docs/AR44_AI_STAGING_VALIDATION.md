# AI Provider Hub — Staging Validation

For each enabled provider:
- credential resolves only at backend runtime;
- one controlled request succeeds;
- provider/model/latency execution metadata is recorded;
- raw credential is absent from logs/errors/browser.

Fallback:
1. select a workload with primary + fallback;
2. force primary timeout/failure;
3. confirm fallback is used;
4. confirm normalized result contract;
5. confirm all-provider failure is deterministic;
6. confirm canonical/public data is not mutated automatically.

Provider configuration may be changed without rebuilding the frontend.
