# AR-37 Bootstrap & Seed

Bootstrap is idempotent and environment-aware.

Allowed:
- capabilities/roles;
- provider registry metadata without keys;
- workload policy defaults;
- system taxonomies;
- initial feature flags;
- development fixtures only in DEV.

Forbidden in shared staging/production seed:
- real provider keys;
- hard-coded Admin passwords;
- copied personal production data;
- fabricated canonical product facts presented as verified.

First privileged operator enrollment must use the deployment identity/auth
procedure rather than a repository password.
