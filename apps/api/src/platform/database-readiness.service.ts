import type {Pool,QueryConfig} from 'pg';

type SchemaRow={catalog_ready:boolean;outbox_ready:boolean};
type TimedQuery=QueryConfig&{query_timeout:number};

export type DatabaseReadinessCheck={
  name:'database';status:'UP'|'DOWN';latencyMs:number;
  reason?:'CONNECTION_UNAVAILABLE'|'SCHEMA_NOT_READY';
};

export class DatabaseReadinessService {
  constructor(
    private readonly pool:Pick<Pool,'query'>,
    private readonly timeoutMs:number,
  ) {}

  async check():Promise<DatabaseReadinessCheck> {
    const started=Date.now();
    try {
      const query:TimedQuery={
        text:`select
          to_regclass('catalog.product_model') is not null catalog_ready,
          to_regclass('ops.outbox_event') is not null outbox_ready`,
        query_timeout:this.timeoutMs,
      };
      const result=await this.pool.query<SchemaRow>(query);
      const ready=Boolean(
        result.rows[0]?.catalog_ready&&result.rows[0]?.outbox_ready,
      );
      return {
        name:'database',status:ready?'UP':'DOWN',
        latencyMs:Date.now()-started,
        ...(ready?{}:{reason:'SCHEMA_NOT_READY' as const}),
      };
    } catch {
      return {
        name:'database',status:'DOWN',latencyMs:Date.now()-started,
        reason:'CONNECTION_UNAVAILABLE',
      };
    }
  }
}
