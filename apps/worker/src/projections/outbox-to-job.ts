import { Pool } from 'pg';

/**
 * Converts catalog domain events into idempotent projection jobs.
 */
export async function enqueueProjectionForEvent(pool:Pool,event:any) {
  if (!['catalog.product_created','catalog.product_updated'].includes(event.eventType))
    return;

  await pool.query(
    `insert into ops.job
     (id,job_type,job_version,payload,status,available_at)
     values (gen_random_uuid(),'projection.product_search',1,$1::jsonb,'PENDING',now())
     on conflict do nothing`,
    [JSON.stringify({ productId:event.aggregateId,eventId:event.id })],
  );
}
