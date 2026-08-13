import {Pool} from 'pg';
import type {EventPublisher} from './outbox-dispatcher';
import {routePriceEvent} from './commerce/price-event-router';
import {routeEditorialPublication} from './editorial/publication-event-router';
import {routeMediaEvent} from './media/media-event-router';
import {enqueueProjectionForEvent} from './projections/outbox-to-job';

type DomainEvent=Parameters<EventPublisher['publish']>[0];

export class DatabaseEventRouter implements EventPublisher {
  constructor(private readonly pool:Pool) {}

  async publish(event:DomainEvent) {
    await enqueueProjectionForEvent(this.pool,event);
    await routePriceEvent(this.pool,event);
    await routeEditorialPublication(this.pool,event);
    await routeMediaEvent(this.pool,event);

    if (event.eventType==='knowledge.canonical_fact_changed') {
      await this.pool.query(
        `insert into ops.job
         (id,source_event_id,job_type,job_version,payload,status,available_at)
         values (gen_random_uuid(),$1,'projection.canonical_change',1,$2::jsonb,
                 'PENDING',now())
         on conflict (source_event_id,job_type) where source_event_id is not null do nothing`,
        [event.id,JSON.stringify({...asRecord(event.payload),eventId:event.id})],
      );
    }
  }
}

function asRecord(value:unknown):Record<string,unknown> {
  return value && typeof value==='object' ? value as Record<string,unknown> : {};
}
