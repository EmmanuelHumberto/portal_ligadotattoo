import {Inject,Injectable} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class RunEditorialAutoDraftHandler{
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async execute(){
    const result=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'editorial.auto_draft',1,
              jsonb_build_object('candidateId',sc.id),'PENDING',now(),
              'auto-draft:'||sc.id::text
         from editorial.story_candidate sc
        where sc.status in ('NEW','QUALIFIED')
          and not exists (
            select 1 from ops.job j
             where j.job_type='editorial.auto_draft'
               and j.payload->>'candidateId'=sc.id::text
               and j.status in ('PENDING','RUNNING','RETRY')
          )
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return {enqueued:result.rowCount??0};
  }
}
