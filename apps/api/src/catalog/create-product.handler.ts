import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { OutboxRepository } from '../platform/outbox.repository';
import { ProductModel } from './product-model.domain';
import { ProductRepository } from './product.repository';
import {PostgresAuditRepository} from '../platform/audit.repository';

@Injectable()
export class CreateProductHandler {
  constructor(
    private readonly txm: TransactionManager,
    private readonly products: ProductRepository,
    private readonly outbox: OutboxRepository,
    private readonly audit:PostgresAuditRepository,
  ) {}

  execute(input: {
    manufacturerId: string; productTypeKey: string; name: string;
    slug: string; brandId?: string; modelCode?: string;
  },actorId:string) {
    return this.txm.run(async tx => {
      const product = ProductModel.create({ id: randomUUID(), ...input });
      await this.products.insert(product, tx);
      await this.audit.append({actorId,action:'catalog.product_created',
        subjectType:'ProductModel',subjectId:product.id,
        metadata:{name:product.name,slug:product.slug}},tx);
      await this.outbox.append({
        id: randomUUID(),
        type: 'catalog.product_created',
        version: 1,
        aggregateType: 'ProductModel',
        aggregateId: product.id,
        occurredAt: new Date(),
        payload: { name: product.name, slug: product.slug },
      }, tx);
      return product;
    });
  }
}
