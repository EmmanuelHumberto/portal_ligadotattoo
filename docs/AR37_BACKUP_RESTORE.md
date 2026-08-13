# AR-37 Backup & Restore

Production PostgreSQL target baseline:
- automated daily full backup/snapshot;
- continuous WAL/PITR where managed platform supports it;
- retention target: 30 days;
- encrypted backups in separate failure domain/account where practical;
- quarterly restore exercise minimum.

Object media:
- versioning where supported;
- lifecycle/retention aligned with rights and deletion policy;
- restore procedure must not republish TAKEDOWN/EXPIRED assets without current
  rights re-evaluation.

Restore exercise records RPO/RTO achieved, integrity checks and operator steps.
A backup that has never been restored is not considered operationally verified.
