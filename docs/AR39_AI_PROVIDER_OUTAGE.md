# AI Provider Outage Playbook

1. Confirm provider-specific failure via execution telemetry.
2. Determine affected workloads/models/regions.
3. Verify no application-wide dependency on a single provider.
4. Route eligible workloads through configured fallback provider.
5. Reduce nonessential AI workload concurrency if fallback capacity is constrained.
6. Preserve deterministic non-AI portal reads where possible.
7. Do not relax canonical governance to compensate for AI unavailability.
8. Monitor fallback latency, error rate and cost.
9. Disable failing provider temporarily when repeated attempts create queue pressure.
10. Restore primary routing only after sustained health.

If all providers fail:
- degrade AI-assisted workflows explicitly;
- queue eligible asynchronous work within bounded backlog policy;
- keep human/manual authority paths available;
- do not fabricate AI output.
