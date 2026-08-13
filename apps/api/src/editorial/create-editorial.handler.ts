import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { EditorialContent } from './editorial.domain';
import { EditorialRepository } from './editorial.repository';

@Injectable()
export class CreateEditorialHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly repository:EditorialRepository,
  ) {}

  execute(input:any,actorId:string) {
    return this.txm.run(async tx => {
      const content=EditorialContent.draft({id:randomUUID(),...input});
      await this.repository.insert(content,actorId,tx);
      return content;
    });
  }
}
