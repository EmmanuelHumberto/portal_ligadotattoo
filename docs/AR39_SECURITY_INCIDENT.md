# Security Incident Response

Detection:
- anomalous privileged access;
- leaked credential report;
- authorization bypass;
- malicious upload/execution;
- SSRF/network boundary breach;
- suspicious data extraction.

Contain:
- revoke/rotate affected credentials;
- disable compromised account/session;
- block exploit path at edge/API;
- isolate affected worker/provider integration;
- preserve logs/audit and immutable evidence.

Investigate:
- initial access vector;
- affected identities/data/systems;
- timeline and persistence;
- whether canonical/public data was altered;
- whether secrets reached logs/browser/artifacts.

Recover:
- patch and independently verify;
- rotate credentials;
- restore known-good artifacts/data where needed;
- increase monitoring;
- follow applicable organizational/legal notification procedures.

Never destroy evidence as part of cleanup.
