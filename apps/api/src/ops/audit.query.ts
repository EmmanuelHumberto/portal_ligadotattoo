import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import { redactOperationalValue } from './redaction';

@Injectable()
export class AuditQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async list(input:{
    actorId?:string;action?:string;subjectType?:string;subjectId?:string;
    from?:string;to?:string;limit?:number;
  }) {
    const r=await this.pool.query(
      `select id,actor_id,action,subject_type,subject_id,reason,metadata,
              correlation_id,created_at
         from ops.audit_event
        where ($1::text is null or actor_id=$1)
          and ($2::text is null or action=$2)
          and ($3::text is null or subject_type=$3)
          and ($4::text is null or subject_id=$4)
          and ($5::timestamptz is null or created_at >= $5)
          and ($6::timestamptz is null or created_at <= $6)
        order by created_at desc limit $7`,
      [input.actorId ?? null,input.action ?? null,input.subjectType ?? null,
       input.subjectId ?? null,input.from ?? null,input.to ?? null,
       Math.min(Math.max(input.limit ?? 100,1),500)],
    );
    return {items:r.rows.map(safeAudit)};
  }

  async detail(id:string) {
    const r=await this.pool.query(
      `select id,actor_id,action,subject_type,subject_id,reason,metadata,
              correlation_id,created_at
         from ops.audit_event where id=$1`,[id],
    );
    return r.rowCount ? safeAudit(r.rows[0]) : null;
  }
}
function safeAudit(x:any) {
  return {...x,metadata:redactOperationalValue(x.metadata ?? {})};
}
