import {Inject,Injectable} from '@nestjs/common';
import {createHash} from 'node:crypto';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class ExperimentService {
 constructor(@Inject(PG_POOL) private readonly pool:Pool){}

 async assignment(experimentId:string,sessionId:string){
  const r=await this.pool.query(
   `select id,status,variants from analytics.experiment where id=$1`,
   [experimentId],
  );
  if(!r.rowCount||r.rows[0].status!=='RUNNING')return null;
  const variants=r.rows[0].variants as Array<{key:string;weight:number}>;
  const n=parseInt(createHash('sha256')
   .update(`${experimentId}:${sessionId}`).digest('hex').slice(0,8),16)/0xffffffff;
  let cursor=0;
  for(const v of variants){
   cursor+=v.weight;
   if(n<cursor)return v.key;
  }
  return variants.at(-1)?.key??null;
 }
}
