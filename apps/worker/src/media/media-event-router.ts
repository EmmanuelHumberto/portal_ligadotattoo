import { Pool } from 'pg';

export async function routeMediaEvent(pool:Pool,event:any) {
  if (event.eventType!=='media.rights_changed') return;
  await pool.query(
    `insert into ops.cache_invalidation(id,cache_key,reason,created_at)
     values (gen_random_uuid(),$1,'media-rights-changed',now())`,
    [`media:${event.aggregateId}`],
  );
}
