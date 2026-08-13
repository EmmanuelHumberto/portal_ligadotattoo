# Health & Readiness Contract

Web `/api/health`:
- confirms Web runtime is serving.

API `/health/live`:
- process is alive.

API `/health/ready`:
- process is eligible for traffic.
Final integrated readiness should include critical database connectivity and any
dependency required for synchronous request correctness.

Implemented API behavior:
- `/health/live` stays independent from PostgreSQL;
- `/health/ready` verifies connectivity and the critical catalog/outbox schema;
- unavailable database or missing schema returns HTTP 503 without error details;
- idle pool connection errors are handled without terminating the API process;
- graceful shutdown encerra o pool antes de finalizar o processo;
- connection/readiness timeouts are bounded by runtime configuration.

Worker:
- operational dashboard/heartbeat must prove processor loop is advancing;
- queue/outbox lag remains the authoritative async-health signal.

Implemented Worker behavior:
- UUID efêmero por processo, sem hostname persistido;
- início/fim, duração e falhas de cada ciclo registrados no PostgreSQL;
- startup grace e limiar de heartbeat obsoleto configuráveis;
- processo parado/travado degrada o readiness administrativo;
- `SIGTERM`/`SIGINT` registra `STOPPED` antes de fechar o pool.

A liveness endpoint must not fail merely because an optional AI provider is down.
AI provider health is surfaced separately and handled through workload fallback.
