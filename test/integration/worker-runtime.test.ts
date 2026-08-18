import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {DatabaseEventRouter} from '../../apps/worker/src/event-router';
import {JobRunner} from '../../apps/worker/src/job-runner';
import {OutboxDispatcher} from '../../apps/worker/src/outbox-dispatcher';
import {ProductSearchProjectionHandler} from '../../apps/worker/src/projections/product-search.handler';

const databaseUrl=process.env.TEST_DATABASE_URL;
const integration=databaseUrl ? describe : describe.skip;

integration('worker runtime',()=>{
 const pool=new Pool({connectionString:databaseUrl});
 const manufacturerId=randomUUID();
 const productId=randomUUID();
 const eventId=randomUUID();

 beforeAll(async()=>{
  await pool.query(
   `insert into catalog.manufacturer
    (id,name,normalized_name,slug,status,version)
    values ($1,'Worker Test','worker test',$2,'ACTIVE',1)`,
   [manufacturerId,`worker-test-${manufacturerId}`],
  );
  await pool.query(
   `insert into catalog.product_model
    (id,manufacturer_id,product_type_key,name,normalized_name,slug,lifecycle,version)
    values ($1,$2,'TATTOO_MACHINE','Worker Machine','worker machine',$3,'ACTIVE',1)`,
   [productId,manufacturerId,`worker-machine-${productId}`],
  );
  await pool.query(
   `insert into ops.outbox_event
    (id,event_type,event_version,aggregate_type,aggregate_id,payload,status,occurred_at)
    values ($1,'catalog.product_created',1,'ProductModel',$2,$3::jsonb,'PENDING',now())`,
   [eventId,productId,JSON.stringify({productId})],
  );
 });

 afterAll(async()=>{
  await pool.query('delete from search.search_document where source_id=$1',[productId]);
  await pool.query('delete from ops.job where source_event_id=$1',[eventId]);
  await pool.query('delete from ops.outbox_event where id=$1',[eventId]);
  await pool.query('delete from catalog.product_model where id=$1',[productId]);
  await pool.query('delete from catalog.manufacturer where id=$1',[manufacturerId]);
  await pool.end();
 });

 it('routes an outbox event and executes its projection job',async()=>{
  const dispatcher=new OutboxDispatcher(pool,new DatabaseEventRouter(pool));
  await dispatcher.dispatchBatch(1,eventId);
  const queued=await pool.query(
   'select id from ops.job where source_event_id=$1',[eventId],
  );
  const handler=new ProductSearchProjectionHandler(pool);
  const runner=new JobRunner(pool,new Map([[handler.type,handler]]));
  await runner.runOne(queued.rows[0].id);

  const [event,job,projection]=await Promise.all([
   pool.query('select status from ops.outbox_event where id=$1',[eventId]),
   pool.query('select status from ops.job where source_event_id=$1',[eventId]),
   pool.query('select title,public_url from search.search_document where source_id=$1',[productId]),
  ]);
  expect(event.rows[0]?.status).toBe('PUBLISHED');
  expect(job.rows[0]?.status).toBe('DONE');
  expect(projection.rows[0]?.title).toBe('Worker Machine');
  expect(projection.rows[0]?.public_url).toBe(`/maquinas/worker-machine-${productId}`);
 });

 it('does not duplicate a job when an event is delivered again',async()=>{
  const router=new DatabaseEventRouter(pool);
  const event={
   id:eventId,eventType:'catalog.product_created',eventVersion:1,
   aggregateType:'ProductModel',aggregateId:productId,payload:{productId},
  };
  await router.publish(event);
  await router.publish(event);

  const result=await pool.query(
   'select count(*)::int as count from ops.job where source_event_id=$1',
   [eventId],
  );
  expect(result.rows[0]?.count).toBe(1);
 });
});
