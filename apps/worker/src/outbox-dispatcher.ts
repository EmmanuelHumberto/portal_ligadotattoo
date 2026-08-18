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

  async dispatchBatch(limit = 50,eventId?:string): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selected = await client.query(
        `select id,event_type,event_version,aggregate_type,aggregate_id,payload
           from ops.outbox_event
          where status='PENDING' and available_at <= now()
            and ($2::uuid is null or id=$2)
          order by occurred_at
          for update skip locked
          limit $1`,
        [limit,eventId??null],
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
        } catch (error) {
          await client.query(
            `update ops.outbox_event
                set attempts=attempts+1,
                    available_at=now() + (interval '1 second' * least(300, power(2, attempts + 1))),
                    last_error=$2
              where id=$1`,
            [row.id,safeError(error)],
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

function safeError(error:unknown) {
  const message=error instanceof Error ? error.message : String(error);
  return message.replace(/(token|secret|password|key)=\S+/gi,'$1=[REDACTED]').slice(0,1000);
}
