import {Inject,Injectable} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import type {SourceKind} from './source.domain';

@Injectable()
export class RunIngestionHandler{
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async execute(kind?:SourceKind){
    const result=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       select gen_random_uuid(),'ingestion.run_target',1,
              jsonb_build_object('targetId',t.id),'PENDING',now(),
              'ingestion:'||t.id::text||':'||floor(extract(epoch from now())/60)::bigint
         from ingestion.crawl_target t
         join ingestion.source s on s.id=t.source_id
        where t.status='ACTIVE' and s.status='ACTIVE'
          and ($1::text is null or s.kind=$1)
          and not exists (
            select 1 from ops.job j
             where j.job_type='ingestion.run_target'
               and j.status in ('PENDING','RUNNING','RETRY')
               and j.payload->>'targetId'=t.id::text
          )
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,[kind??null],
    );
    return {enqueued:result.rowCount??0};
  }
}
