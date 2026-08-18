import {Pool} from 'pg';
import type { JobHandler, JobResult } from '../job-runner';

export class CatalogTranslateHandler implements JobHandler {
  readonly type='catalog.translate';

  constructor(
    private readonly pool:Pool,
    private readonly apiBase:string,
    private readonly internalKey:string,
  ) {}

  async handle():Promise<JobResult>{
    if(!this.internalKey)return 'NON_RETRYABLE';
    const rows=await this.pool.query(
      `select p.id
         from knowledge.canonical_proposal p
        where p.subject_type='PRODUCT_MODEL'
          and p.property_key='description' and p.status='PENDING'
          and p.created_by='catalog-discovery'
          and not exists (
            select 1 from knowledge.canonical_proposal translated
             where translated.subject_type=p.subject_type
               and translated.subject_id=p.subject_id
               and translated.property_key=p.property_key
               and translated.status='PENDING'
               and translated.created_by='ai:catalog.translate'
          )
        order by p.created_at limit 40`,
    );
    for(const r of rows.rows){
      try {
        const response=await fetch(`${this.apiBase}/internal/catalog/translate-description`,{
          method:'POST',headers:{
            'content-type':'application/json','x-internal-key':this.internalKey,
          },body:JSON.stringify({proposalId:r.id}),
        });
        if(!response.ok&&response.status>=500)return 'RETRYABLE';
      } catch {
        return 'RETRYABLE';
      }
    }
    return 'DONE';
  }
}
