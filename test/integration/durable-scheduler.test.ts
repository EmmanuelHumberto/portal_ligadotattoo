import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {DurableScheduler} from '../../apps/worker/src/durable-scheduler';
import {ScheduledPublicationHandler} from '../../apps/worker/src/editorial/scheduled-publication.handler';

const databaseUrl=process.env.TEST_DATABASE_URL;
const integration=databaseUrl ? describe : describe.skip;

integration('durable scheduler',()=>{
 const pool=new Pool({connectionString:databaseUrl});
 const sourceId=randomUUID();
 const targetId=randomUUID();
 const unsupportedTargetId=randomUUID();
 const contentId=randomUUID();

 beforeAll(async()=>{
  await pool.query(
   `insert into ingestion.source
    (id,name,kind,base_url,allowed_hosts,robots_policy,status)
    values ($1,'Scheduler Test','TEST','https://example.test',
            array['example.test'],'RESPECT','ACTIVE')`,[sourceId],
  );
  await pool.query(
   `insert into ingestion.crawl_target
    (id,source_id,url,discovery_mode,schedule_key,status)
    values
     ($1,$3,'https://example.test/feed','MIXED','5m','ACTIVE'),
     ($2,$3,'https://example.test/manual','MIXED','manual','ACTIVE')`,
   [targetId,unsupportedTargetId,sourceId],
  );
  await pool.query(
   `insert into editorial.content
    (id,content_type,title,slug,body_document,status,origin,created_by,
     scheduled_at,version)
    values ($1,'NEWS','Scheduled Test',$2,'{}','SCHEDULED','HUMAN',
            'integration-admin',now()-interval '1 minute',1)`,
   [contentId,`scheduled-${contentId}`],
  );
 });

 afterAll(async()=>{
  await pool.query(
   `delete from ops.job
     where payload->>'contentId'=$1 or payload->>'targetId' in ($2,$3)`,
   [contentId,targetId,unsupportedTargetId],
  );
  await pool.query(
   `delete from ops.outbox_event
     where aggregate_type='EditorialContent' and aggregate_id=$1`,[contentId],
  );
  await pool.query('delete from editorial.content where id=$1',[contentId]);
  await pool.query(
   'delete from ingestion.crawl_target where source_id=$1',[sourceId],
  );
  await pool.query('delete from ingestion.source where id=$1',[sourceId]);
  await pool.end();
 });

 it('enqueues due work once across repeated ticks',async()=>{
  const scheduler=new DurableScheduler(pool);
  await scheduler.enqueueDue();
  await scheduler.enqueueDue();

  const [editorial,target,unsupported]=await Promise.all([
   pool.query(
    `select count(*)::int count from ops.job
      where job_type='editorial.publish_scheduled'
        and payload->>'contentId'=$1`,[contentId],
   ),
   pool.query(
    `select count(*)::int count from ops.job
      where job_type='ingestion.run_target' and payload->>'targetId'=$1`,
    [targetId],
   ),
   pool.query(
    `select count(*)::int count from ops.job
      where job_type='ingestion.run_target' and payload->>'targetId'=$1`,
    [unsupportedTargetId],
   ),
  ]);
  expect(editorial.rows[0]?.count).toBe(1);
  expect(target.rows[0]?.count).toBe(1);
  expect(unsupported.rows[0]?.count).toBe(0);
 });

 it('publishes due editorial content with its outbox event',async()=>{
  await new ScheduledPublicationHandler(pool).handle({contentId});
  const [content,event]=await Promise.all([
   pool.query('select status from editorial.content where id=$1',[contentId]),
   pool.query(
    `select event_type,status from ops.outbox_event
      where aggregate_type='EditorialContent' and aggregate_id=$1`,[contentId],
   ),
  ]);
  expect(content.rows[0]?.status).toBe('PUBLISHED');
  expect(event.rows[0]).toMatchObject({
   event_type:'editorial.content_published',status:'PENDING',
  });
 });
});
