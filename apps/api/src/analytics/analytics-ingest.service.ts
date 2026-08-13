import {Inject,Injectable} from '@nestjs/common';
import {createHash,randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import {sanitizeEvent} from './event-contract';

@Injectable()
export class AnalyticsIngestService {
 constructor(@Inject(PG_POOL) private readonly pool:Pool){}

 async accept(raw:any,request:{ip?:string;userAgent?:string}){
  const e=sanitizeEvent(raw);
  if(!e.anonymousSessionId)throw new Error('SESSION_REQUIRED');

  // IP is used only to derive a short-lived abuse bucket, not persisted raw.
  const day=new Date().toISOString().slice(0,10);
  const abuseBucket=createHash('sha256')
   .update(`${day}:${request.ip??''}:${process.env.ANALYTICS_HASH_SALT??''}`)
   .digest('hex').slice(0,24);

  await this.pool.query(
   `insert into analytics.event
    (id,event_name,anonymous_session_id,properties,occurred_at,
     received_at,abuse_bucket)
    values ($1,$2,$3,$4,$5,now(),$6)`,
   [randomUUID(),e.name,e.anonymousSessionId,
    JSON.stringify(e.properties),e.occurredAt,abuseBucket],
  );
 }
}
