# AR-37 Rollback Runbook

Application rollback:
1. stop further promotion;
2. identify last healthy release manifest;
3. redeploy previous Web/API/Worker image digests;
4. verify readiness;
5. run public and privileged smoke tests;
6. confirm queues/outbox continue processing;
7. record incident/release rollback.

Database:
- backward-compatible expand migrations normally remain in place during app rollback;
- do not execute destructive reverse migrations automatically;
- if data/schema corruption requires restore, invoke the database recovery runbook.

Secrets:
- suspected credential compromise requires revoke/rotate, not merely application rollback.
