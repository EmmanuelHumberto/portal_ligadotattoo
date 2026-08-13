import { Module } from '@nestjs/common';
import { OutboxRepository } from '../platform/outbox.repository';
import { CatalogController } from './catalog.controller';
import { CreateManufacturerHandler } from './create-manufacturer.handler';
import { ManufacturerRepository } from './manufacturer.repository';

@Module({
  controllers: [CatalogController],
  providers: [ManufacturerRepository, OutboxRepository, CreateManufacturerHandler],
})
export class CatalogModule {}
