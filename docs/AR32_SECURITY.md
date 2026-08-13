# AR-32 Operational Security

Audit and operations endpoints are privileged administrative surfaces.

The API deliberately excludes raw job payloads and raw outbox payloads from list
views. Where diagnostic metadata is returned, recursive redaction removes common
credential/token/password fields and bounds large strings.

Readiness is an application health projection, not an infrastructure control
plane. It must not expose environment variables, connection strings, host
credentials or provider secrets.

Recommended production controls:
- separate `audit.read` and `operations.read`;
- MFA/strong authentication for privileged operators;
- audit access itself may be audited;
- rate-limit expensive filters;
- retention policy for audit and operational records;
- export privileges separate from interactive read privileges;
- SIEM forwarding for security-significant audit events.
