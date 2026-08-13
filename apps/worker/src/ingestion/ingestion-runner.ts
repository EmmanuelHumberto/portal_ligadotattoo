import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { HttpAcquirer } from './http-acquirer';

export class IngestionRunner {
  constructor(private readonly pool:Pool,private readonly http:HttpAcquirer) {}

  async runTarget(targetId:string) {
    const t=await this.pool.query(
      `select t.*,s.allowed_hosts,s.status source_status
         from ingestion.crawl_target t
         join ingestion.source s on s.id=t.source_id
        where t.id=$1 and t.status='ACTIVE'`,
      [targetId],
    );
    if (!t.rowCount || t.rows[0].source_status!=='ACTIVE')
      return 'DONE' as const;

    const target=t.rows[0];
    const runId=randomUUID();
    await this.pool.query(
      `insert into ingestion.run
       (id,source_id,target_id,status,started_at)
       values ($1,$2,$3,'RUNNING',now())`,
      [runId,target.source_id,target.id],
    );

    try {
      const result=await this.http.acquire({
        url:target.url,allowedHosts:target.allowed_hosts,
        maxBytes:target.max_bytes,
      });

      const prior=await this.pool.query(
        `select id from ingestion.snapshot
          where source_id=$1 and sha256=$2 limit 1`,
        [target.source_id,result.sha256],
      );

      let snapshotId=prior.rows[0]?.id;
      if (!snapshotId) {
        snapshotId=randomUUID();
        await this.pool.query(
          `insert into ingestion.snapshot
           (id,source_id,target_id,url,content_type,http_status,sha256,
            body_bytes,observed_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,now())`,
          [snapshotId,target.source_id,target.id,result.finalUrl,
           result.contentType,result.status,result.sha256,result.body],
        );
        await this.enqueueExtraction(snapshotId,target);
      }

      await this.pool.query(
        `update ingestion.run set status='SUCCEEDED',finished_at=now(),
                snapshot_id=$2,deduplicated=$3 where id=$1`,
        [runId,snapshotId,Boolean(prior.rowCount)],
      );
      await this.pool.query(
        `update ingestion.crawl_target set last_crawled_at=now() where id=$1`,
        [target.id],
      );
      return 'DONE' as const;
    } catch (e:any) {
      await this.pool.query(
        `update ingestion.run set status='FAILED',finished_at=now(),
                error_code=$2,error_message=$3 where id=$1`,
        [runId,e?.name ?? 'INGESTION_ERROR',String(e?.message ?? e).slice(0,1000)],
      );
      return 'RETRYABLE' as const;
    }
  }

  private async enqueueExtraction(snapshotId:string,target:any) {
    await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at)
       values (gen_random_uuid(),'ingestion.extract',1,$1::jsonb,'PENDING',now())`,
      [JSON.stringify({
        snapshotId,sourceId:target.source_id,targetId:target.id,
        discoveryMode:target.discovery_mode,
      })],
    );
  }
}
