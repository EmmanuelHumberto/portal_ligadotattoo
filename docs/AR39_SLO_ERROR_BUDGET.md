# SLO & Error Budget Operations

Initial monthly targets inherited from AR-37:
- public portal availability: 99.9%;
- API successful-request availability: 99.9%;
- public API p95 latency: < 500 ms for normal synchronous reads.

Operating policy:
- > 50% monthly error budget consumed before midpoint: freeze discretionary
  reliability-risking releases and prioritize remediation.
- > 80% consumed: release only reliability/security fixes unless explicitly
  approved by incident/reliability ownership.
- 100% consumed: reliability stabilization mode; no normal feature promotion.

Error budget never authorizes security, privacy, rights or data-integrity failures.
Those controls are governed independently and may trigger immediate freeze.
