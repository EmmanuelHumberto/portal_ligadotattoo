import {Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {OutboxRepository} from '../platform/outbox.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {ProductFactInput} from './admin-product.input';
import {CuratedProductFactRepository} from './curated-product-fact.repository';

@Injectable()
export class SetProductSpecsHandler {
  constructor(private readonly txm:TransactionManager,
    private readonly facts:CuratedProductFactRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository){}
  execute(productId:string,input:ProductFactInput[],actorId:string){
    return this.txm.run(async tx=>{
      const product=await tx.query(
        'select 1 from catalog.product_model where id=$1 for update',[productId],
      );
      if(!product.rowCount)throw new NotFoundException('Produto não encontrado');
      for(const fact of input){
        const result=await this.facts.replace(productId,fact,actorId,tx);
        await this.outbox.append({id:randomUUID(),
          type:'knowledge.canonical_fact_changed',version:1,
          aggregateType:'CanonicalProposal',aggregateId:result.proposalId,
          occurredAt:new Date(),payload:{subjectType:'PRODUCT_MODEL',
            subjectId:productId,propertyKey:fact.key}},tx);
      }
      await this.audit.append({actorId,action:'catalog.product_specs_changed',
        subjectType:'ProductModel',subjectId:productId,
        metadata:{propertyKeys:input.map(x=>x.key)}},tx);
      return {facts:input.length};
    });
  }
}
