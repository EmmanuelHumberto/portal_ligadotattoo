import { Pool } from 'pg';

export async function routePriceEvent(pool:Pool,event:any) {
  if (event.eventType!=='commerce.price_observed') return;
  await pool.query(
    `insert into ops.job
     (id,job_type,job_version,payload,status,available_at)
     values (gen_random_uuid(),'projection.price_trend',1,$1::jsonb,
             'PENDING',now())`,
    [JSON.stringify({listingId:event.aggregateId,eventId:event.id})],
  );
}
