# Scenario — Ingestion to Public

1. Register/enable a controlled staging source.
2. Trigger ingestion run.
3. Assert source fetch uses safe URL fetch boundary.
4. Persist immutable source observation/evidence.
5. Produce claim/proposal candidate.
6. If AI enrichment is enabled, record provider/model/workload execution.
7. Assert AI output does not automatically become canonical.
8. Human/admin approval promotes the eligible canonical fact.
9. Public projection refreshes/invalidation executes.
10. Public product endpoint exposes approved fact and provenance.
11. Audit contains approval action.
12. Outbox processing reaches DONE.
13. Re-run same ingestion and assert idempotency/no duplicate canonical fact.

Blocking failures: SSRF bypass, automatic AI authority, missing evidence,
un-audited promotion, duplicate canonical mutation.
