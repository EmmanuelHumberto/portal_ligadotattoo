# Release Security Regression

Execute AR-36 matrix plus:
- anonymous Admin enumeration;
- horizontal/vertical authorization attempts;
- CSRF against every cookie-authenticated mutation;
- CSP violation inspection on Home/Product/Admin;
- XSS payloads in editorial/product metadata;
- SSRF private/loopback/link-local/IPv6/redirect/DNS cases;
- oversized and signature-mismatched uploads;
- rate-limit behavior under legitimate burst and abusive sustained traffic;
- secret scan of built browser assets;
- secret scan of representative API/worker logs;
- affiliate redirect destination tampering;
- cache serving media after TAKEDOWN;
- dependency/container scan against exact RC digests.

Any exploitable critical/high issue without approved mitigation is NO-GO.
