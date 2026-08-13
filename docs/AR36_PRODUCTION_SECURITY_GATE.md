# AR-36 Production Security Gate

Required before public launch:
1. TLS enforced at edge; production HSTS verified.
2. CSP tested on representative routes with no unexpected violations.
3. Admin authentication/session expiry/MFA path verified.
4. CSRF negative tests pass on every cookie-authenticated mutation.
5. Authorization matrix regression passes for Admin capabilities.
6. Rate limits load-tested and tuned against legitimate traffic.
7. Upload polyglot/malformed/oversized cases rejected; image decoder sandbox reviewed.
8. SSRF suite covers loopback, RFC1918, link-local, IPv6 local, DNS rebinding
   assumptions and redirect-to-private cases.
9. Secrets absent from browser bundles, logs, audit metadata and error pages.
10. Backup/restore and database encryption posture verified operationally.
11. Dependency/container scans pass release policy.
12. Audit retention and privileged-access monitoring configured.
13. Incident rollback/revoke procedure exercised.
14. CDN/cache invalidation tested for takedown and rights expiry.
15. External penetration test or equivalent independent review scheduled before
    high-risk production exposure.
