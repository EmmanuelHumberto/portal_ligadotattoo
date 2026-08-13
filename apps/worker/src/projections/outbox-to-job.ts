import { Pool } from 'pg';

/**
 * Converts catalog domain events into idempotent projection jobs.
 */
export async function enqueueProjectionForEvent(pool:Pool,event:any) {
  if (!['catalog.product_created','catalog.product_updated'].includes(event.eventType))
    return;

  await pool.query(
    `insert into ops.job
     (id,source_event_id,job_type,job_version,payload,status,available_at)
     values (gen_random_uuid(),$1,'projection.product_search',1,$2::jsonb,'PENDING',now())
     on conflict (source_event_id,job_type) where source_event_id is not null do nothing`,
    [event.id,JSON.stringify({ productId:event.aggregateId,eventId:event.id })],
  );
}
