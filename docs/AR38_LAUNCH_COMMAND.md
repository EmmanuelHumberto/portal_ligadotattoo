# Launch Command Model

The release decision is deliberately separated from deployment execution.

Required sign-offs/owners should cover:
- product/content authority;
- engineering/release;
- security;
- operations/data.

Recommended final record:

Release: <release id>
Candidate digests: <web/api/worker>
Migration set: <ids>
Decision: GO | CONDITIONAL GO | NO-GO
Blocking findings: <none/list>
Accepted conditions: <none/list>
Rollback target: <previous release>
Backup checkpoint: <reference>
Decision timestamp: <UTC>
Approvers: <identities from organization process>

Do not store passwords, provider keys or signing secrets in the release record.
