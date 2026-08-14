import {Pool} from 'pg';

const SCHEDULE_SECONDS:Record<string,number>={
  '5m':300,'15m':900,'1h':3600,'6h':21600,'24h':86400,
};

export class DurableScheduler {
  constructor(
    private readonly pool:Pool,
    private readonly retentionDays=7,
  ) {}

  async enqueueDue():Promise<number> {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      const locked=await client.query(
        `select pg_try_advisory_xact_lock(hashtext('portal-worker-scheduler')) locked`,
      );
      if(!locked.rows[0]?.locked) {
        await client.query('COMMIT');
        return 0;
      }

      let count=0;
      count+=await this.enqueueEditorial(client);
      count+=await this.enqueueIngestion(client);
      count+=await this.enqueueAutoDraft(client);
      count+=await this.enqueueMaintenance(client);
      await this.pruneCompletedJobs(client);
      await client.query('COMMIT');
      return count;
    } catch(error) {
      await client.query('ROLLBACK').catch(()=>undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async enqueueEditorial(client:PoolClientLike) {
    const result=await client.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'editorial.publish_scheduled',1,
              jsonb_build_object('contentId',c.id),'PENDING',now(),
              'editorial:'||c.id::text||':'||extract(epoch from c.scheduled_at)::bigint
         from editorial.content c
        where c.status='SCHEDULED' and c.scheduled_at<=now()
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return result.rowCount??0;
  }

  private async enqueueIngestion(client:PoolClientLike) {
    const result=await client.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'ingestion.run_target',1,
              jsonb_build_object('targetId',t.id),'PENDING',now(),
              'ingestion:'||t.id::text||':'||
                floor(extract(epoch from now())/(case t.schedule_key
                  when '5m' then 300 when '15m' then 900
                  when '1h' then 3600 when '6h' then 21600
                  when '24h' then 86400 end))::bigint
         from ingestion.crawl_target t
         join ingestion.source s on s.id=t.source_id
        where t.status='ACTIVE' and s.status='ACTIVE'
          and t.schedule_key in ('5m','15m','1h','6h','24h')
          and (t.last_crawled_at is null or t.last_crawled_at<=now()-(case t.schedule_key
            when '5m' then interval '5 minutes'
            when '15m' then interval '15 minutes'
            when '1h' then interval '1 hour'
            when '6h' then interval '6 hours'
            when '24h' then interval '24 hours' end))
          and not exists (
            select 1 from ops.job j
             where j.job_type='ingestion.run_target'
               and j.status in ('PENDING','RUNNING','RETRY')
               and j.payload->>'targetId'=t.id::text
          )
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return result.rowCount??0;
  }

  private async enqueueAutoDraft(client:PoolClientLike) {
    const flag=await client.query(
      `select value from editorial.pipeline_setting where key='auto_draft_enabled'`,
    );
    if(flag.rowCount && flag.rows[0].value!=='true') return 0;

    const result=await client.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'editorial.auto_draft',1,
              jsonb_build_object('candidateId',sc.id),'PENDING',now(),
              'auto-draft:'||sc.id::text
         from editorial.story_candidate sc
        where sc.status in ('NEW','QUALIFIED')
          and not exists (
            select 1 from ops.job j
             where j.job_type='editorial.auto_draft'
               and j.payload->>'candidateId'=sc.id::text
               and j.status in ('PENDING','RUNNING','RETRY')
          )
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return result.rowCount??0;
  }

  private async enqueueMaintenance(client:PoolClientLike) {
    const result=await client.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       values
        (gen_random_uuid(),'media.expire_rights',1,'{}','PENDING',now(),
         'minute:'||floor(extract(epoch from now())/60)::bigint),
        (gen_random_uuid(),'commerce.mark_stale',1,'{}','PENDING',now(),
         'five-minutes:'||floor(extract(epoch from now())/300)::bigint)
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return result.rowCount??0;
  }

  private async pruneCompletedJobs(client:PoolClientLike) {
    await client.query(
      `delete from ops.job where id in (
         select id from ops.job
          where status='DONE'
            and completed_at<now()-($1::integer*interval '1 day')
          order by completed_at limit 1000
       )`,
      [this.retentionDays],
    );
  }
}

export function scheduleSeconds(key:string) {
  const seconds=SCHEDULE_SECONDS[key];
  if(!seconds)throw new Error(`Unsupported schedule_key: ${key}`);
  return seconds;
}

export function workerRetentionDays(value:string|undefined) {
  const days=Number(value??7);
  if(!Number.isInteger(days)||days<1||days>90)
    throw new Error('Invalid WORKER_JOB_RETENTION_DAYS');
  return days;
}

export function workerSchedulerIntervalMs(value:string|undefined) {
  const interval=Number(value??30000);
  if(!Number.isInteger(interval)||interval<1000||interval>300000)
    throw new Error('Invalid WORKER_SCHEDULER_INTERVAL_MS');
  return interval;
}

type PoolClientLike={query:(sql:string,values?:unknown[])=>Promise<any>};
