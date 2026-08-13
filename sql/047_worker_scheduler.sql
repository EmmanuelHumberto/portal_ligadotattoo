begin;

alter table ops.job
  add column if not exists deduplication_key text null;

create unique index if not exists ux_job_deduplication
  on ops.job(job_type,deduplication_key)
  where deduplication_key is not null;

create index if not exists ix_crawl_target_schedule
  on ingestion.crawl_target(status,schedule_key,last_crawled_at)
  where status='ACTIVE' and schedule_key is not null;

create index if not exists ix_editorial_scheduled_due
  on editorial.content(scheduled_at)
  where status='SCHEDULED';

commit;
