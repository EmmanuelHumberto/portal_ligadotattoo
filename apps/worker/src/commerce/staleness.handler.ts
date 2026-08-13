import { Pool } from 'pg';

export class ListingStalenessHandler {
  readonly type='commerce.mark_stale';
  constructor(private readonly pool:Pool){}

  async handle() {
    await this.pool.query(
      `update commerce.listing li
          set status='STALE',updated_at=now(),version=version+1
         from commerce.seller s
        where s.id=li.seller_id
          and li.status='ACTIVE'
          and (li.last_observed_at is null or
               li.last_observed_at < now()-s.public_freshness_interval)`,
    );
    return 'DONE' as const;
  }
}
