# Final Risk Register

The following cannot be closed by formulation alone:

R1 — Historical code integration
The individual AR examples must exist in one actual repository and conflicts must
be reconciled. Owner: engineering. Gate: AR-43 execution.

R2 — Dependency/build compatibility
Exact package versions and lockfile must pass clean install/typecheck/build.
Owner: engineering. Gate: AR-43.

R3 — Database migration compatibility
Full historical migration chain must execute against clean and rehearsal DBs.
Owner: engineering/data. Gate: AR-43/AR-38.

R4 — Real provider behavior
Enabled OpenAI/Anthropic/DeepSeek adapters require controlled staging tests with
valid staging credentials. Owner: engineering/AI operations. Gate: AR-44.

R5 — Infrastructure-specific security
TLS/WAF/CDN/KMS/network policy/backup implementation depends on deployment
platform. Owner: security/operations. Gate: AR-36/AR-44.

R6 — Load/capacity
Actual traffic capacity must be measured in staging/prod-like infrastructure.
Owner: operations. Gate: AR-38.

R7 — External security review
Independent review/pentest remains recommended/required by the production gate.
Owner: security.

These are execution risks, not reasons to extend architecture indefinitely.
