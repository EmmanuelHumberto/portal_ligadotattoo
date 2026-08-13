import { Pool } from 'pg';

export async function routeEditorialPublication(pool:Pool,event:any) {
  if (event.eventType !== 'editorial.content_published') return;
  await pool.query(
    `insert into ops.job
     (id,job_type,job_version,payload,status,available_at)
     values
       (gen_random_uuid(),'projection.editorial_search',1,$1::jsonb,'PENDING',now())`,
    [JSON.stringify({contentId:event.aggregateId,eventId:event.id})],
  );
  await pool.query(
    `insert into ops.cache_invalidation(id,cache_key,reason,created_at)
     values
       (gen_random_uuid(),$1,'editorial-published',now()),
       (gen_random_uuid(),$2,'editorial-published',now())`,
    [`editorial:${event.aggregateId}`,`editorial-feed:${event.payload.contentType}`],
  );
}
