# AR-37 Database Migration Policy

Production migrations follow expand/contract.

Expand release:
- add nullable columns/tables/indexes;
- deploy code compatible with old and new schema;
- backfill asynchronously when required.

Transition:
- verify backfill and new-code adoption;
- observe errors/latency;
- stop old writers before enforcing new invariants.

Contract release:
- remove obsolete columns/tables only in a later release;
- destructive migration requires explicit review and tested restore path.

Migration jobs are single-purpose deployment jobs and use a dedicated database
identity. Application pods do not receive schema-owner credentials.

A failed migration stops workload promotion. Never automatically roll the
database backward by running guessed reverse SQL.
