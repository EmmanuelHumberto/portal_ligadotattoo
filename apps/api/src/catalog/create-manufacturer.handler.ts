import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { OutboxRepository } from '../platform/outbox.repository';
import { Manufacturer } from './manufacturer.domain';
import { ManufacturerRepository } from './manufacturer.repository';

export type CreateManufacturerCommand = {
  name: string;
  slug: string;
  officialWebsite?: string;
  countryCode?: string;
};

@Injectable()
export class CreateManufacturerHandler {
  constructor(
    private readonly transactions: TransactionManager,
    private readonly repository: ManufacturerRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(command: CreateManufacturerCommand) {
    return this.transactions.run(async tx => {
      if (await this.repository.findBySlug(command.slug, tx))
        throw Object.assign(new Error('Manufacturer slug already exists'), { name: 'ConflictError' });

      const manufacturer = Manufacturer.create({
        id: randomUUID(),
        ...command,
      });

      await this.repository.insert(manufacturer, tx);
      await this.outbox.append({
        id: randomUUID(),
        type: 'catalog.manufacturer_created',
        version: 1,
        aggregateType: 'Manufacturer',
        aggregateId: manufacturer.id,
        occurredAt: new Date(),
        payload: { name: manufacturer.name, slug: manufacturer.slug },
      }, tx);

      return manufacturer;
    });
  }
}
