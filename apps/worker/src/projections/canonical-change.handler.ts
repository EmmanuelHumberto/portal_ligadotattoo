import { Pool } from 'pg';

/**
 * Canonical changes invalidate/rebuild public product projections.
 * Current AR-25 product detail reads canonical facts directly, so this job
 * primarily refreshes search/cache dependent materialized projections.
 */
export class CanonicalChangeHandler {
  readonly type='projection.canonical_change';

  constructor(private readonly pool:Pool) {}

  async handle(payload:any) {
    if (payload.subjectType !== 'PRODUCT_MODEL') return 'DONE' as const;

    await this.pool.query(
      `insert into ops.cache_invalidation
       (id,cache_key,reason,created_at)
       values (gen_random_uuid(),$1,$2,now())`,
      [
        `product:${payload.subjectId}`,
        `canonical:${payload.propertyKey}`,
      ],
    );

    await this.pool.query(
      `insert into ops.job
       (id,job_type,job_version,payload,status,available_at)
       values (gen_random_uuid(),'projection.product_search',1,$1::jsonb,
               'PENDING',now())`,
      [JSON.stringify({productId:payload.subjectId})],
    );

    return 'DONE' as const;
  }
}
