import {BadRequestException,Injectable} from '@nestjs/common';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';
import type {UpdateEditorialInput} from './admin-editorial.input';

@Injectable()
export class UpdateEditorialDraftHandler{
  constructor(
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
  ){}

  execute(id:string,input:UpdateEditorialInput,actorId:string){
    return this.txm.run(async tx=>{
      const result=await tx.query(
        `update editorial.content
            set title=$2, subtitle=$3, summary=$4, body_document=$5::jsonb,
                version=version+1, updated_at=now()
          where id=$1 and status='DRAFT'
          returning id,title,subtitle,summary,version`,
        [id,input.title,input.subtitle,input.summary,JSON.stringify(input.body)],
      );
      if(!result.rowCount)
        throw new BadRequestException('Somente rascunhos podem ser editados');
      await this.audit.append({
        actorId,action:'editorial.draft_updated',subjectType:'EditorialContent',
        subjectId:id,
      },tx);
      return result.rows[0];
    });
  }
}
