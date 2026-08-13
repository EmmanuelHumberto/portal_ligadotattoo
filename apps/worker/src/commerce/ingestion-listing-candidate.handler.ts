import { Pool } from 'pg';

export class ListingCandidateHandler {
  readonly type='commerce.discovery_candidate';
  constructor(private readonly pool:Pool){}

  async handle(payload:any) {
    const r=await this.pool.query(
      `select dc.*,s.kind source_kind
         from ingestion.discovery_candidate dc
         join ingestion.source s on s.id=dc.source_id
        where dc.id=$1 and dc.status='NEW'`,
      [payload.discoveryCandidateId],
    );
    if (!r.rowCount || r.rows[0].source_kind!=='RETAILER')
      return 'DONE' as const;

    await this.pool.query(
      `insert into commerce.listing_candidate
       (id,source_id,snapshot_id,title,status,created_at)
       values (gen_random_uuid(),$1,$2,$3,'NEW',now())
       on conflict (snapshot_id) do nothing`,
      [r.rows[0].source_id,r.rows[0].snapshot_id,r.rows[0].title],
    );
    return 'DONE' as const;
  }
}
