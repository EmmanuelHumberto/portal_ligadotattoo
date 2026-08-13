# Release Rollback Triggers

Strong rollback candidates:
- new release causes sustained critical journey failures;
- error rate breaches release guardrail and correlates with deployment;
- readiness/liveness instability;
- data writes remain backward compatible and previous app digest is healthy;
- new frontend causes severe client failure.

Rollback alone is insufficient when:
- credentials are compromised (rotate/revoke);
- destructive/data-corrupting migration occurred (invoke recovery);
- external provider is down (route/degrade);
- malicious data entered canonical state (contain/reconcile).

During stabilization, compare current metrics to the pre-release baseline before
declaring recovery.
