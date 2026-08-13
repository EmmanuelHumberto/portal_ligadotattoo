# AR-36 Threat Model

Primary protected assets:
- privileged Admin sessions and capabilities;
- provider/API/storage credentials;
- canonical catalog/editorial authority;
- audit integrity;
- media rights controls;
- ingestion network boundary;
- availability of public/search endpoints.

Threats and controls:
- XSS: CSP, React escaping, bounded JSON-LD escaping, no arbitrary HTML by default.
- CSRF: same-site cookies plus Origin and double-submit token validation for
  cookie-authenticated mutations.
- credential leakage: backend-only secrets, operational redaction, no raw job
  payloads, secret references rather than values.
- SSRF: AR-28 private-network/DNS validation is mandatory for every dynamic URL
  fetch; redirects are revalidated.
- brute force/credential stuffing: auth-specific rate class, edge throttling,
  strong authentication/MFA for privileged operators.
- scraping/DoS: public/search quotas, cache, coarse abuse scoring, infrastructure
  WAF/CDN controls where available.
- malicious uploads: allowlist MIME, byte limits, magic-byte validation, isolated
  object storage, worker decoding, rights/review gate before public use.
- prompt injection: AR-29 treats acquired content as untrusted; AI output has no
  automatic canonical/public authority.
- affiliate abuse: outbound destinations resolved server-side through AR-30.
- stale/restricted media leakage: rights invalidation outranks cache.
- supply chain: locked dependencies, CI vulnerability scan, image scan, minimal
  runtime user and no privileged container requirement.

Residual risk must be tracked rather than silently accepted.
