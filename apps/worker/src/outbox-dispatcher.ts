import { Pool } from 'pg';

export interface EventPublisher {
  publish(event: {
    id: string; eventType: string; eventVersion: number;
    aggregateType: string; aggregateId: string; payload: unknown;
  }): Promise<void>;
}

export class OutboxDispatcher {
  constructor(
    private readonly pool: Pool,
    private readonly publisher: EventPublisher,
  ) {}

  async dispatchBatch(limit = 50): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selected = await client.query(
        `select id,event_type,event_version,aggregate_type,aggregate_id,payload
           from ops.outbox_event
          where status='PENDING' and available_at <= now()
          order by occurred_at
          for update skip locked
          limit $1`,
        [limit],
      );

      for (const row of selected.rows) {
        try {
          await this.publisher.publish({
            id: row.id, eventType: row.event_type,
            eventVersion: row.event_version,
            aggregateType: row.aggregate_type,
            aggregateId: row.aggregate_id,
            payload: row.payload,
          });
          await client.query(
            `update ops.outbox_event
                set status='PUBLISHED', published_at=now(), attempts=attempts+1
              where id=$1`,
            [row.id],
          );
        } catch {
          await client.query(
            `update ops.outbox_event
                set attempts=attempts+1,
                    available_at=now() + (interval '1 second' * least(300, power(2, attempts + 1)))
              where id=$1`,
            [row.id],
          );
        }
      }
      await client.query('COMMIT');
      return selected.rowCount ?? 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
