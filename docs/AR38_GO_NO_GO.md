# AR-38 GO / CONDITIONAL GO / NO-GO

## GO
All P0/P1 gates pass on the exact staging release candidate:
- no unresolved critical security finding;
- migrations verified and rehearsed;
- critical public and Admin journeys pass;
- ingestion -> evidence -> approval -> public flow passes;
- media rights/takedown behavior passes;
- AI provider fallback passes for configured production workloads;
- smoke and readiness pass;
- performance thresholds meet agreed release targets;
- backup/restore capability is operationally verified;
- monitoring/alerts/on-call are active;
- rollback manifest and previous healthy digests are available.

## CONDITIONAL GO
Allowed only for non-critical deficiencies with:
- no security/data-integrity/publication-authority impact;
- documented owner;
- explicit remediation deadline;
- monitoring/containment in place;
- release approver acceptance.

Examples may include a non-critical visual defect or a non-blocking analytics gap.

## NO-GO
Any of:
- critical/high exploitable security issue without accepted mitigation;
- data corruption or destructive migration uncertainty;
- AI output can bypass human/canonical governance;
- restricted/takedown media remains publicly cached;
- Admin authorization bypass;
- secrets exposed to browser/logs;
- inability to rollback application;
- unverified production backup/restore posture;
- sustained error/latency above blocking thresholds;
- staging candidate differs from production artifact digests.

Decision evidence must be attached to the release record.
