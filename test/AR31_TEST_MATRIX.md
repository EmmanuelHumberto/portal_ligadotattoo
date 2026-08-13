# AR-31 Test Matrix

Library: media.read required; status filter; rights filter; current rights shown; variant count.

Rights: media.review required; PERMITTED requires basis; expected version enforced; old rights becomes historical; one current rights row; audit and outbox written.

Expiry: expired permission changes asset to EXPIRED; public media disappears; cache invalidation created.

Public delivery: ACTIVE+PERMITTED visible; PENDING/UNKNOWN/RESTRICTED/EXPIRED/TAKEDOWN hidden; expired date hidden; storage key/credentials absent.

Variants: image assets generate variants; non-images skipped; variant upsert idempotent.

Security: public URLs originate from delivery adapter; no signed upload secret in public DTO; Admin library never returns secret material.
