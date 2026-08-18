import {Inject,Injectable} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import type {EditorialTopicInput} from './admin-editorial.input';

@Injectable()
export class EditorialTopicRepository{
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async list(){
    const result=await this.pool.query(
      `select id,name,query,language,status,max_articles,last_discovered_at,created_at
         from editorial.topic order by name`,
    );
    return {items:result.rows};
  }

  async create(input:EditorialTopicInput){
    const result=await this.pool.query(
      `insert into editorial.topic (name,query,language,max_articles)
       values ($1,$2,$3,$4) returning id,name,query,language,status,max_articles`,
      [input.name,input.query,input.language,input.maxArticles],
    );
    return result.rows[0];
  }

  async enqueueDiscovery(){
    const result=await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at,deduplication_key)
       values (gen_random_uuid(),'editorial.topic_discovery',1,'{}','PENDING',now(),
               'topic:'||to_char(now(),'YYYY-MM-DD HH24:MI'))
       on conflict (job_type,deduplication_key)
         where deduplication_key is not null do nothing`,
    );
    return {enqueued:result.rowCount??0};
  }

  async setStatus(id:string,status:'ACTIVE'|'PAUSED'){
    const result=await this.pool.query(
      `update editorial.topic set status=$2,updated_at=now()
        where id=$1 returning id,status`,[id,status],
    );
    return result.rows[0]??{id,status};
  }
}
