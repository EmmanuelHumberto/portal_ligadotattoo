import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { OutboxRepository } from '../platform/outbox.repository';
import { CommerceRepository } from './commerce.repository';
import { PriceObservation } from './commerce.domain';
import type {PriceInput} from './admin-commerce.input';

@Injectable()
export class RecordPriceHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly repo:CommerceRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  execute(input:PriceInput&{listingId:string}) {
    return this.txm.run(async tx => {
      const o=PriceObservation.create({id:randomUUID(),...input});
      await this.repo.insertObservation(o,tx);
      await tx.query(
        `update commerce.listing
            set last_observed_at=$2,status=case
              when $3='UNAVAILABLE' then 'UNAVAILABLE' else 'ACTIVE' end,
                updated_at=now(),version=version+1
          where id=$1`,
        [o.listingId,o.observedAt,o.availability],
      );
      await this.outbox.append({
        id:randomUUID(),type:'commerce.price_observed',version:1,
        aggregateType:'Listing',aggregateId:o.listingId,occurredAt:o.observedAt,
        payload:{listingId:o.listingId},
      },tx);
      return o;
    });
  }
}
