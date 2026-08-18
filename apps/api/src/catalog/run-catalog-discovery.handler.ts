import {Injectable} from '@nestjs/common';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';

@Injectable()
export class RunCatalogDiscoveryHandler {
  constructor(private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository){}
  execute(input:{manufacturerSlug:string;machinesOnly:boolean},actorId:string){
    return this.txm.run(async tx=>{
      const deduplicationKey='discovery:'+(input.manufacturerSlug||'all')+':' +
        (input.machinesOnly?'machines':'all')+':'+new Date().toISOString().slice(0,16);
      const result=await tx.query(
        `insert into ops.job
         (id,job_type,job_version,payload,status,available_at,deduplication_key)
         values (gen_random_uuid(),'catalog.discover_machines',1,$1::jsonb,
          'PENDING',now(),$2)
         on conflict (job_type,deduplication_key)
          where deduplication_key is not null do nothing`,
        [JSON.stringify(input),deduplicationKey],
      );
      await this.audit.append({actorId,action:'catalog.discovery_requested',
        subjectType:'CatalogDiscovery',subjectId:deduplicationKey,
        metadata:input},tx);
      return {enqueued:result.rowCount??0,
        manufacturerSlug:input.manufacturerSlug||null,
        machinesOnly:input.machinesOnly};
    });
  }
}
