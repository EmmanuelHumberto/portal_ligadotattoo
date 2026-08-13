# AR-43 Validation Matrix

Static integration:
- workspace graph resolves;
- migration filenames globally ordered;
- no browser provider-key references;
- dynamic URL fetch review;
- Web/API/Worker entrypoints exist.

Compile:
- contracts typecheck;
- Web typecheck/build;
- API typecheck/build;
- Worker typecheck/build.

Runtime:
- migrations apply to clean PostgreSQL;
- API starts and health/live + health/ready respond;
- Web starts and /api/health responds;
- Worker starts and shuts down on SIGTERM;
- AI registry tolerates absent optional provider keys.

AI Provider Hub:
- configured provider registers;
- primary success;
- primary failure -> fallback;
- all failures -> deterministic error;
- no provider credential serialized to Web.

Security/release:
- AR-36 static boundaries;
- AR-38 critical regression suite when integrated;
- exact candidate artifact recording.

AR-43 closes only with evidence from actual execution.
