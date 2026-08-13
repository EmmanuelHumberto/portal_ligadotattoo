import { Injectable } from '@nestjs/common';
import type { Tx } from './transaction-manager';

export type DomainEvent = {
  id: string;
  type: string;
  version: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};

@Injectable()
export class OutboxRepository {
  async append(event: DomainEvent, tx: Tx): Promise<void> {
    await tx.query(
      `insert into ops.outbox_event
       (id, event_type, event_version, aggregate_type, aggregate_id, occurred_at, payload, status)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,'PENDING')`,
      [
        event.id, event.type, event.version, event.aggregateType,
        event.aggregateId, event.occurredAt, JSON.stringify(event.payload),
      ],
    );
  }
}
