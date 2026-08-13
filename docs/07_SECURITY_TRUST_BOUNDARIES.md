# Security & Trust Boundaries

Internet -> Edge/CDN/WAF -> Web -> API -> Database/Workers/External Integrations.

High-risk boundaries:
- browser session -> privileged mutation;
- source-controlled URL -> server-side fetch;
- upload -> decoder/storage;
- external content -> AI prompt;
- AI result -> canonical proposal;
- media asset -> public CDN;
- offer -> affiliate destination;
- deployment pipeline -> production runtime;
- secret manager -> provider/database/storage adapter.

Mandatory controls include:
CSP, TLS/HSTS at verified edge, CSRF/origin checks, capability authorization,
rate limits, safe URL fetch/SSRF defense, upload validation, backend-only secrets,
audit, non-root containers, dependency/image scanning and incident procedures.
