# Health & Readiness Contract

Web `/api/health`:
- confirms Web runtime is serving.

API `/health/live`:
- process is alive.

API `/health/ready`:
- process is eligible for traffic.
Final integrated readiness should include critical database connectivity and any
dependency required for synchronous request correctness.

Worker:
- operational dashboard/heartbeat must prove processor loop is advancing;
- queue/outbox lag remains the authoritative async-health signal.

A liveness endpoint must not fail merely because an optional AI provider is down.
AI provider health is surfaced separately and handled through workload fallback.
