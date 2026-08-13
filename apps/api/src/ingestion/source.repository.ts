import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { Source } from './source.domain';

@Injectable()
export class SourceRepository {
  async insert(s:Source,tx:Tx) {
    await tx.query(
      `insert into ingestion.source
       (id,name,kind,base_url,allowed_hosts,robots_policy,crawl_delay_ms,status,version)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [s.id,s.name,s.kind,s.baseUrl,s.allowedHosts,s.robotsPolicy,
       s.crawlDelayMs,s.status,s.version],
    );
  }

  async findActive(id:string,tx:Tx) {
    const r=await tx.query(
      `select * from ingestion.source where id=$1 and status='ACTIVE'`,[id],
    );
    return r.rows[0] ?? null;
  }
}
