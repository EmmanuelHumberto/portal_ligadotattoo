# AR-36 Security Test Matrix

CSP/headers:
- frame blocked;
- object-src none;
- production upgrade-insecure;
- nosniff/referrer/permissions headers.

CSRF/session:
- safe GET allowed;
- cookie mutation without Origin rejected;
- unapproved Origin rejected;
- missing/mismatched CSRF rejected;
- valid Origin+token accepted;
- bearer service request bypasses browser CSRF only.

Rate/abuse:
- route-class limits;
- actor/IP key separation;
- scan-like paths score higher;
- sustained excess reaches challenge/block policy.

Uploads:
- unsupported MIME;
- oversize;
- MIME/signature mismatch;
- JPEG/PNG/WebP/AVIF/PDF signatures;
- zero byte rejected.

SSRF regression:
- loopback;
- private IPv4;
- link-local;
- IPv6 loopback/local;
- redirect to private;
- DNS resolution changes;
- max byte/timeout.

Secrets:
- no NEXT_PUBLIC secret;
- Admin/ops redaction;
- no credentials in client bundles/errors.

Containers:
- non-root;
- scans;
- lockfile;
- no privileged runtime.
