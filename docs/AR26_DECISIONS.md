# AR-26 Decisions

1. Claims are evidence-bearing assertions, not public truth.
2. Canonical facts can only be created by an authorized `canonical.decide` action.
3. AI providers cannot directly invoke canonical promotion authority.
4. Every proposal requires at least one evidence Claim.
5. Approval closes the previous current fact and inserts a new immutable history row.
6. Existing canonical history is never overwritten.
7. A single current canonical fact per subject/property is enforced by PostgreSQL.
8. Conflicting active claim values open a conflict record.
9. Approval resolves the open property conflict; rejection does not manufacture a fact.
10. Every canonical decision requires a reason.
11. Decisions are audited in the same transaction.
12. Canonical changes emit an Outbox event in the same transaction.
13. Public product DTOs continue reading only current canonical facts.
14. Canonical changes trigger cache/search projection invalidation.
15. Proposal decisions use row locking plus expected version.
16. Claims preserve source URL/snapshot linkage when available.
17. Confidence is metadata, never sufficient authority for automatic canonicalization.
18. `canonical.propose` and `canonical.decide` remain separate capabilities.

## API gap closed

AR-20 identified missing administrative reads. AR-26 now supplies:
- GET /admin/claims
- GET /admin/canonical-proposals
- GET /admin/canonical-proposals/{id}

The remaining AR-20 additive GETs continue to be implemented by their respective domain slices.

## Next artifact

AR-27 — Editorial Automation & Human Curation Executable Slice.

Scope:
- source-to-story candidate pipeline;
- AI-assisted draft generation through Provider Hub port;
- editorial block document;
- review/approval;
- scheduled/direct publication;
- source attribution;
- related products;
- public News/Blog/Event endpoints;
- publication outbox/cache/search projection;
- explicit human-curation policy.
