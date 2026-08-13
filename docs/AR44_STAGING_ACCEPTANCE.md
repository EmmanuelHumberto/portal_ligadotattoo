# Staging Acceptance Checklist

Infrastructure:
- isolated DB/cache/storage;
- HTTPS hostname;
- runtime secrets loaded;
- backups/snapshots available.

Distribution:
- immutable image references;
- migrations complete;
- bootstrap idempotent;
- Web/API/Worker healthy.

Architecture:
- AI Provider Hub backend-only;
- no source -> canonical shortcut;
- media rights enforced;
- affiliate redirect boundary enforced;
- Admin capabilities/audit active.

Verification:
- AR-43 full validation executed;
- AR-38 critical E2E executed;
- AR-36 security regression executed;
- load/performance executed;
- rollback target identified;
- evidence pack complete.

Result must be PASS/FAIL/PENDING per item. PENDING is not PASS.
