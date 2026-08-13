# Scenario — Media Rights + Commerce

Media:
- PERMITTED, ACTIVE, non-expired asset is public.
- PENDING/UNKNOWN/RESTRICTED/TAKEDOWN/EXPIRED asset is not public.
- Expiring current rights removes public eligibility and invalidates cache.
- Variant generation does not alter original rights state.
- public DTO contains delivery URL, never storage credentials.

Commerce:
- fresh eligible listing appears in offers.
- stale/disabled listing is excluded according to freshness policy.
- price observations remain historical/immutable.
- public outbound link points to server redirect boundary.
- affiliate/private parameters are resolved server-side.
- seller/listing changes are auditable where required.
