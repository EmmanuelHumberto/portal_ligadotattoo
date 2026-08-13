# AR-29 Test Matrix

Registry: disabled provider/model excluded; priority ordering; missing workload rejected.

Routing: primary success; primary failure -> fallback; max attempts; circuit opens after repeated failures; timeout aborts request.

Secrets: no key in registry API; no key in execution records; missing secret fails adapter; browser-facing environment contains no provider secret.

Output: valid JSON parsed; malformed JSON fails/falls back; domain schema validation required before persistence.

Budget: output token cap; estimated cost recorded; cost threshold failure.

Observability: provider/model/workload/correlation/latency/token counts recorded; failure records contain bounded error code only.

Authority: AI cannot create canonical facts directly; AI draft remains editorial suggestion; provider choice does not alter capability checks.
