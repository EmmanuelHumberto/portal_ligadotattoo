import { Pool } from 'pg';

export async function routeMediaEvent(pool:Pool,event:any) {
  if(event.eventType==='media.asset_uploaded') {
    await pool.query(
      `insert into ops.job
       (id,source_event_id,job_type,job_version,payload,status,available_at)
       values (gen_random_uuid(),$1,'media.create_variants',1,$2::jsonb,
               'PENDING',now())
       on conflict (source_event_id,job_type) where source_event_id is not null do nothing`,
      [event.id,JSON.stringify({mediaAssetId:event.aggregateId,eventId:event.id})],
    );
  }
  if(event.eventType==='media.rights_changed') {
    await pool.query(
      `insert into ops.cache_invalidation
       (id,source_event_id,cache_key,reason,created_at)
       values (gen_random_uuid(),$1,$2,'media-rights-changed',now())
       on conflict (source_event_id,cache_key) where source_event_id is not null do nothing`,
      [event.id,`media:${event.aggregateId}`],
    );
  }
}
