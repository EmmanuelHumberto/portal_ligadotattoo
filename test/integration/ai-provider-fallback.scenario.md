# Scenario — AI Provider Hub Fallback

For a configured workload:
1. Configure primary provider A and fallback provider B using staging credentials.
2. Execute successful request through A; verify execution record.
3. Simulate A timeout; verify bounded timeout and fallback to B.
4. Simulate A 5xx; verify retry policy then fallback according to workload policy.
5. Simulate invalid credentials; verify no credential material in logs/errors.
6. Exhaust all providers; verify deterministic application failure.
7. Verify cost/latency/provider/model metadata is observable.
8. Verify public/browser DTO contains no provider secret.
9. Change workload routing configuration without frontend rebuild.
10. Restore A and verify routing returns according to configured policy.

Pass requires provider-neutral application behavior and backend-only credentials.
