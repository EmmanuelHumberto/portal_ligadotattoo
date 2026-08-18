import {Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {OutboxRepository} from '../platform/outbox.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {ProductType} from './admin-product.input';
import {CuratedProductFactRepository} from './curated-product-fact.repository';

@Injectable()
export class SetProductTypeHandler {
  constructor(private readonly txm:TransactionManager,
    private readonly facts:CuratedProductFactRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository){}
  execute(id:string,typeKey:ProductType,actorId:string){
    return this.txm.run(async tx=>{
      const updated=await tx.query(
        `update catalog.product_model set product_type_key=$2,
          version=version+1,updated_at=now() where id=$1
          returning id,name,slug,product_type_key`,[id,typeKey],
      );
      if(!updated.rowCount)throw new NotFoundException('Produto não encontrado');
      const product=updated.rows[0];
      const canonical=await this.facts.replace(id,{
        key:'product_type',value:typeKey,unit:null,
      },actorId,tx);
      const info=await tx.query(
        `select m.name manufacturer_name,b.name brand_name
           from catalog.product_model p
           join catalog.manufacturer m on m.id=p.manufacturer_id
           left join catalog.brand b on b.id=p.brand_id where p.id=$1`,[id],
      );
      const subtitle=[info.rows[0]?.manufacturer_name,info.rows[0]?.brand_name,typeKey]
        .filter(Boolean).join(' · ');
      await tx.query(
        `insert into search.search_document
         (id,source_type,source_id,document_type,title,normalized_title,subtitle,
          public_url,is_public,search_vector,updated_at)
         values ($1,'PRODUCT_MODEL',$1,'PRODUCT',$2,lower($2),$3,$4,true,
          setweight(to_tsvector('simple',coalesce($2,'')),'A') ||
          setweight(to_tsvector('simple',coalesce($3,'')),'B'),now())
         on conflict (source_type,source_id) do update
          set subtitle=excluded.subtitle,search_vector=excluded.search_vector,
              updated_at=now()`,[id,product.name,subtitle,`/maquinas/${product.slug}`],
      );
      await this.audit.append({actorId,action:'catalog.product_type_changed',
        subjectType:'ProductModel',subjectId:id,metadata:{productTypeKey:typeKey}},tx);
      await this.outbox.append({id:randomUUID(),
        type:'knowledge.canonical_fact_changed',version:1,
        aggregateType:'CanonicalProposal',aggregateId:canonical.proposalId,
        occurredAt:new Date(),payload:{subjectType:'PRODUCT_MODEL',subjectId:id,
          propertyKey:'product_type'}},tx);
      return {id,name:product.name,productTypeKey:typeKey};
    });
  }
}
