import {Injectable,NotFoundException} from '@nestjs/common';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';

@Injectable()
export class RenameProductHandler {
  constructor(private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository){}
  execute(id:string,name:string,actorId:string){
    return this.txm.run(async tx=>{
      const result=await tx.query(
        `update catalog.product_model set name=$2,normalized_name=lower($2),
          version=version+1,updated_at=now() where id=$1
          returning id,name,slug`,[id,name],
      );
      if(!result.rowCount)throw new NotFoundException('Produto não encontrado');
      await tx.query(
        `update search.search_document set title=$2,normalized_title=lower($2),
          search_vector=setweight(to_tsvector('simple',coalesce($2,'')),'A') ||
            setweight(to_tsvector('simple',coalesce(subtitle,'')),'B'),updated_at=now()
          where source_type='PRODUCT_MODEL' and source_id=$1`,[id,name],
      );
      await this.audit.append({actorId,action:'catalog.product_renamed',
        subjectType:'ProductModel',subjectId:id,metadata:{name}},tx);
      return result.rows[0];
    });
  }
}
