import { Pool } from 'pg';

export async function routePriceEvent(pool:Pool,event:any) {
  if (event.eventType!=='commerce.price_observed') return;
  await pool.query(
    `insert into ops.job
     (id,source_event_id,job_type,job_version,payload,status,available_at)
     values (gen_random_uuid(),$1,'projection.price_trend',1,$2::jsonb,
             'PENDING',now())
     on conflict (source_event_id,job_type) where source_event_id is not null do nothing`,
    [event.id,JSON.stringify({listingId:event.aggregateId,eventId:event.id})],
  );
}
