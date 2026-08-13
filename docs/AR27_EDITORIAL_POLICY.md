# AR-27 — Editorial Automation Policy

## Authority model

### AI may
- classify discovered material;
- identify possible news/event candidates;
- summarize source material;
- suggest titles and summaries;
- generate structured draft blocks;
- suggest related products;
- extract event fields;
- identify uncertainty for human review.

### AI may not
- convert a technical claim into a canonical fact;
- fabricate a source;
- publish restricted media;
- silently remove uncertainty;
- overwrite human-approved canonical knowledge;
- bypass authorization.

## Publication baseline

Default workflow:

`DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED`

or:

`DRAFT -> IN_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED`

Human capabilities:
- `editorial.write`
- `editorial.approve`
- `editorial.publish`

## Direct publication policy gate

The architecture allows a future policy-controlled automatic publication path for low-risk editorial workloads, but it is **disabled in this baseline**.

Enabling it later requires:
- explicit workload allowlist;
- source trust threshold;
- content-type allowlist;
- media rights pass;
- no unresolved high-risk factual flags;
- audit trail;
- kill switch;
- post-publication review queue.

No technical specification becomes canonical through this path.

## Source attribution

Published material must preserve source references where the content depends on external reporting or evidence.

## AI provenance

Internal Admin records provider/model/correlation metadata for AI-assisted drafting. Public pages do not need to expose provider identity.

## Events

Event status must support:
- SCHEDULED
- POSTPONED
- CANCELLED
- COMPLETED

Cancellation/postponement must remain visually explicit in the frontend.

## Media

Publication is blocked when linked media is not both:
- ACTIVE
- PERMITTED
