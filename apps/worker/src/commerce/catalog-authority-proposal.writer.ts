import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';

export class CatalogAuthorityProposalWriter{
  constructor(private readonly pool:Pool){}

  async propose(input:{
    productId:string;propertyKey:string;value:string;sourceUrl:string;
  }):Promise<void>{
    const client=await this.pool.connect();
    const claimId=randomUUID();
    const proposalId=randomUUID();
    try{
      await client.query('begin');
      const duplicate=await client.query(
        `select 1 from knowledge.canonical_proposal
          where subject_type='PRODUCT_MODEL' and subject_id=$1
            and property_key=$2 and proposed_value=$3::jsonb
            and status='PENDING'
          limit 1`,
        [input.productId,input.propertyKey,JSON.stringify(input.value)],
      );
      if(duplicate.rowCount){await client.query('rollback');return;}
      await client.query(
        `insert into knowledge.claim
         (id,subject_type,subject_id,property_key,value,claimant_type,source_url,
          observed_at,confidence,status,version,created_at)
         values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,'MANUFACTURER',$5,now(),0.7,
                 'ACTIVE',1,now())`,
        [claimId,input.productId,input.propertyKey,JSON.stringify(input.value),input.sourceUrl],
      );
      await client.query(
        `insert into knowledge.canonical_proposal
         (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,status,
          created_by,created_at,version)
         values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,ARRAY[$5]::uuid[],'PENDING',
                 'catalog-discovery',now(),1)`,
        [proposalId,input.productId,input.propertyKey,JSON.stringify(input.value),claimId],
      );
      await client.query('commit');
    }catch(error){
      await client.query('rollback');
      throw error;
    }finally{client.release();}
  }
}
