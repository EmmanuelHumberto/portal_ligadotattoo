# Emergency Media Takedown

Use when media must be removed immediately for rights, safety or legal reasons.

1. Identify exact MediaAsset IDs and public subjects.
2. Set rights state to TAKEDOWN through privileged audited operation.
3. Emit/invoke priority cache invalidation.
4. Purge CDN/object delivery cache where infrastructure requires it.
5. Verify public API no longer returns the asset.
6. Verify representative product/editorial/event pages.
7. Verify direct delivery URL behavior according to storage/CDN policy.
8. Record actor, reason, timestamp and evidence.
9. Do not delete rights/audit history to conceal prior publication.

Target operational objective: takedown propagation should be measured and
alerted. A concrete SLA must be approved from production infrastructure capability.
