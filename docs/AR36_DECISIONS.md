# AR-36 Decisions

1. Security is layered across browser, API, worker, edge and infrastructure.
2. Cookie-authenticated writes require Origin + CSRF token validation.
3. Bearer/service calls do not use browser CSRF semantics.
4. Endpoint classes have distinct quota profiles.
5. Abuse scoring uses coarse request signals, not invasive fingerprinting.
6. Upload trust requires MIME allowlist, size limits and signature validation.
7. Every dynamic server-side URL fetch must pass through the safe-fetch boundary.
8. CSP blocks framing and object embedding.
9. HSTS is enabled only at the verified production HTTPS edge.
10. Runtime containers operate as non-root.
11. Secrets rotate independently of frontend builds.
12. Independent security review remains a production gate, not replaced by code.

## Next artifact
AR-37 — Deployment, Environments, CI/CD & Release Engineering.

Scope: environment topology, IaC boundaries, migrations, CI/CD pipeline, artifact
promotion, deployment strategy, rollback, backups, observability wiring, smoke
tests, seed/bootstrap, runbooks and launch checklist.
