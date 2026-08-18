import {Inject,Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import type {Tx} from '../platform/transaction-manager';

@Injectable()
export class CatalogTranslationRepository {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async sourceProposal(id:string) {
    const result=await this.pool.query(
      `select p.id,p.subject_id,p.property_key,p.proposed_value,p.evidence_ids,
              c.source_url
         from knowledge.canonical_proposal p
         left join knowledge.claim c on c.id=p.evidence_ids[1]
        where p.id=$1 and p.subject_type='PRODUCT_MODEL'
          and p.property_key='description' and p.status='PENDING'
          and p.created_by='catalog-discovery'`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async createTranslatedProposal(input:{
    sourceProposalId:string;subjectId:string;translation:string;
    evidenceIds:string[];sourceUrl:string|null;modelKey:string;
  },tx:Tx) {
    const locked=await tx.query(
      `select 1 from knowledge.canonical_proposal
        where id=$1 and status='PENDING' for update`,
      [input.sourceProposalId],
    );
    if(!locked.rowCount)throw new Error('Source proposal is no longer pending');

    const duplicate=await tx.query(
      `select id from knowledge.canonical_proposal
        where subject_type='PRODUCT_MODEL' and subject_id=$1
          and property_key='description' and status='PENDING'
          and created_by='ai:catalog.translate'
        limit 1`,
      [input.subjectId],
    );
    if(duplicate.rowCount)return {id:duplicate.rows[0].id,created:false};

    const claim=await tx.query(
      `insert into knowledge.claim
       (id,subject_type,subject_id,property_key,value,claimant_type,claimant_id,
        source_url,observed_at,confidence,status,version,created_at)
       values (gen_random_uuid(),'PRODUCT_MODEL',$1,'description',$2::jsonb,
        'AI',$3,$4,now(),0.5,'ACTIVE',1,now()) returning id`,
      [input.subjectId,JSON.stringify(input.translation),input.modelKey,input.sourceUrl],
    );
    const proposal=await tx.query(
      `insert into knowledge.canonical_proposal
       (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
        status,created_by,created_at,version)
       values (gen_random_uuid(),'PRODUCT_MODEL',$1,'description',$2::jsonb,
        $3::uuid[],'PENDING','ai:catalog.translate',now(),1) returning id`,
      [input.subjectId,JSON.stringify(input.translation),
       [...new Set([...input.evidenceIds,claim.rows[0].id])]],
    );
    return {id:proposal.rows[0].id,created:true};
  }
}
