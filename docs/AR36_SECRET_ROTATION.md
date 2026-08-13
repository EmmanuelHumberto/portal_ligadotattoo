# AR-36 Secret Rotation Boundary

Applications reference secret names, never persisted secret values.

Production recommendation:
- secret manager/KMS-backed runtime resolver;
- separate secrets by environment and provider;
- least-privilege service identities;
- rotation without frontend rebuild;
- dual-key overlap where provider supports it;
- emergency revoke procedure;
- audit secret configuration changes without logging secret material.

Provider keys, database credentials, storage credentials and session signing keys
must never use `NEXT_PUBLIC_*`.

Rotation verification should test old-key revocation after the overlap window.
