import { Pool } from 'pg';

export async function routeEditorialPublication(pool:Pool,event:any) {
  if (event.eventType !== 'editorial.content_published') return;
  await pool.query(
    `insert into ops.job
     (id,source_event_id,job_type,job_version,payload,status,available_at)
     values
       (gen_random_uuid(),$1,'projection.editorial_search',1,$2::jsonb,'PENDING',now())
     on conflict (source_event_id,job_type) where source_event_id is not null do nothing`,
    [event.id,JSON.stringify({contentId:event.aggregateId,eventId:event.id})],
  );
  await pool.query(
    `insert into ops.cache_invalidation(id,source_event_id,cache_key,reason,created_at)
     values
       (gen_random_uuid(),$1,$2,'editorial-published',now()),
       (gen_random_uuid(),$1,$3,'editorial-published',now())
     on conflict (source_event_id,cache_key) where source_event_id is not null do nothing`,
    [event.id,`editorial:${event.aggregateId}`,`editorial-feed:${event.payload.contentType}`],
  );
}
