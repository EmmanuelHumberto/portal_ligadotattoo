# Incident Severity Model

## SEV-1 — Critical
Examples:
- privileged authorization bypass;
- confirmed secret exposure with active exploitability;
- material data corruption;
- restricted/takedown media broadly public due to control failure;
- portal/API effectively unavailable for a large share of users;
- canonical authority bypass at scale.

Response:
- immediate incident command;
- freeze releases;
- containment/rollback/revoke as applicable;
- continuous coordination until stabilized;
- preserve evidence.

## SEV-2 — Major
Examples:
- substantial feature degradation;
- primary AI provider outage with inadequate fallback capacity;
- ingestion backlog threatening freshness objectives;
- elevated error rate affecting important journeys;
- commerce offers materially stale/unavailable.

## SEV-3 — Moderate
Localized defect with workaround and no security/integrity impact.

## SEV-4 — Minor
Low-impact presentation, analytics or operational issue.

Severity may increase as evidence changes. Security/integrity impact takes
precedence over raw user-count estimates.
