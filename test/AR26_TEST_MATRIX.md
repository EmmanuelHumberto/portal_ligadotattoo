# AR-26 Test Matrix

## Claims
- record valid claim
- reject missing value
- confidence bounds
- preserve evidence source
- equal claim does not open conflict
- differing active value opens one conflict only

## Proposals
- evidence required
- proposal queue read
- proposal detail includes evidence
- proposal detail includes current canonical fact

## Decisions
- capability required
- reason required
- expected version enforced
- rejected proposal creates no canonical fact
- approved proposal creates current fact
- second approval closes previous fact
- canonical history remains immutable
- concurrent decision cannot create two current facts
- approval resolves open conflict
- audit written transactionally
- outbox event written transactionally

## Public boundary
- unapproved claim never appears in public product specification
- approved fact appears after commit
- previous fact disappears from current DTO but remains in history

## Projection
- canonical product change queues invalidation
- non-product canonical change does not queue product projection
