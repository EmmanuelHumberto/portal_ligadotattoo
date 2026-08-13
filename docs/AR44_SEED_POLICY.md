# Staging Seed Policy

Allowed staging seed:
- roles/capabilities;
- system taxonomy;
- AI provider registry metadata without secret values;
- workload policy defaults;
- synthetic brands/products/content;
- controlled test sources;
- feature flags.

Forbidden:
- hard-coded privileged passwords;
- production provider credentials;
- copied production personal data;
- synthetic facts represented as verified production truth;
- unrestricted media without rights/test provenance.

Seed operations must be idempotent.
