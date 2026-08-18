import {Injectable,NotFoundException} from '@nestjs/common';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {productMetaInput} from './admin-product.input';

type MetaInput=ReturnType<typeof productMetaInput>;

@Injectable()
export class UpdateProductMetaHandler {
  constructor(private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository){}
  execute(id:string,input:MetaInput,actorId:string){
    return this.txm.run(async tx=>{
      const sets:string[]=[];const values:unknown[]=[];
      const add=(column:string,value:unknown)=>{
        values.push(value);sets.push(`${column}=$${values.length}`);
      };
      if(input.lifecycle!==undefined)add('lifecycle',input.lifecycle);
      if(input.modelCode!==undefined)add('model_code',input.modelCode);
      if(input.releaseDate!==undefined)add('release_date',input.releaseDate);
      if(input.discontinuedDate!==undefined)
        add('discontinued_date',input.discontinuedDate);
      values.push(id);
      const result=await tx.query(
        `update catalog.product_model set ${sets.join(',')},
          version=version+1,updated_at=now() where id=$${values.length}
          returning id,name,slug,model_code,lifecycle,release_date,discontinued_date`,
        values,
      );
      if(!result.rowCount)throw new NotFoundException('Produto não encontrado');
      await this.audit.append({actorId,action:'catalog.product_meta_changed',
        subjectType:'ProductModel',subjectId:id,
        metadata:{fields:Object.keys(input)}},tx);
      return result.rows[0];
    });
  }
}
