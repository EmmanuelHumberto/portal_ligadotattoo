# Retention & Privacy

Baseline analytics identity is session-scoped and first-party.

Not used:
- third-party cross-site identifiers;
- browser fingerprint construction;
- raw IP persistence in analytics events;
- raw search query persistence in product analytics;
- email/phone/name as analytics dimensions.

Retention analysis can use aggregated return behavior where a separately approved
first-party account or consented durable identifier exists. Without that basis,
the baseline reports session cohorts and aggregate trends rather than attempting
to reconstruct a person across sessions.

Operational abuse buckets are daily salted hashes and are not product-retention IDs.
