# AR-40 Test Matrix

Events:
- unknown event rejected;
- unknown property dropped;
- free-form PII property not accepted;
- raw IP not stored;
- body size bounded at web proxy.

Funnels:
- unique session counts;
- search zero-result calculation;
- compare/offer progression.

Experiments:
- inactive experiment no assignment;
- deterministic assignment;
- weighted variants;
- exposure required for attribution.

Privacy:
- session identity rotates with browser session;
- no fingerprint;
- no raw query analytics dimension;
- daily abuse bucket not used as retention ID.

Admin:
- analytics.read required;
- overview window bounded;
- quality/opportunity projections exposed.
