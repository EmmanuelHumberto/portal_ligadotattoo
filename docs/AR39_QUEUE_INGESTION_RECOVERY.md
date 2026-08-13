# Queue, Outbox & Ingestion Recovery

Trigger signals:
- oldest pending > 15 minutes;
- retry acceleration;
- dead-letter growth;
- ingestion freshness objective missed;
- outbox publication lag.

Procedure:
1. classify dependency failure vs poison payload vs capacity issue;
2. stop amplification if a worker version is generating repeated failures;
3. inspect redacted error summary and correlation IDs;
4. isolate poison jobs into dead letter;
5. restore dependency/capacity;
6. requeue only known-safe/idempotent work;
7. observe backlog drain rate;
8. verify no duplicate canonical mutations;
9. reconcile source run/evidence/outbox counts;
10. document any manual database intervention.

Never bulk-requeue unknown failures without understanding idempotency.
