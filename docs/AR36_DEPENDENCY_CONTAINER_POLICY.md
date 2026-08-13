# AR-36 Dependency & Container Policy

CI gates:
- deterministic lockfile install;
- dependency vulnerability scan;
- secret scan;
- SAST baseline;
- container image vulnerability scan;
- license policy check where required;
- fail release on critical exploitable findings unless formally risk-accepted.

Runtime:
- non-root process;
- read-only filesystem where compatible;
- drop Linux capabilities;
- no Docker socket;
- explicit outbound network policy;
- resource CPU/memory limits;
- health/readiness endpoints;
- immutable image digest promotion;
- separate web/API/worker identities.
