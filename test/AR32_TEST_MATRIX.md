# AR-32 Test Matrix

Audit:
- audit.read required;
- filters by actor/action/subject/date;
- detail 404;
- metadata secrets recursively redacted;
- large strings truncated.

Operations:
- operations.read required;
- jobs list omits payload;
- outbox list omits payload;
- dead letters visible;
- cache invalidations visible;
- dashboard aggregates AI/ingestion/media/jobs/outbox.

Readiness:
- database failure => DOWN;
- old large backlog => DEGRADED;
- healthy database/backlogs => UP;
- no credentials or connection strings returned.

Closure:
- GET /admin/audit exists;
- all tracked AR-20 additive Admin reads are implemented.
