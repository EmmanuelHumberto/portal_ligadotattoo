# AR-37 Launch Checklist

Release:
- CI green and immutable image digests recorded;
- staging ran the exact production candidate digests;
- migration verification passed;
- production approval recorded;
- rollback manifest available.

Security:
- AR-36 production gate completed;
- TLS/HSTS/CSP verified;
- secrets loaded from runtime secret store;
- Admin authentication/MFA verified;
- rate limits and WAF policy active.

Data:
- production backup successful;
- PITR/restore capability verified;
- migrations applied;
- bootstrap completed;
- no DEV fixtures.

Operations:
- dashboards and alerts active;
- on-call/incident ownership defined;
- dead-letter/outbox monitoring active;
- external provider failure/fallback tested.

Frontend:
- AR-35 SEO/accessibility/performance gates passed;
- robots/sitemap/canonical host verified;
- media CDN and rights invalidation tested;
- offer redirects tested.

Post-deploy:
- public smoke;
- Admin smoke;
- worker processing smoke;
- error-rate/latency observation window;
- release record finalized.
