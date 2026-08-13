import { Pool } from 'pg';

export class PriceTrendProjectionHandler {
  readonly type='projection.price_trend';
  constructor(private readonly pool:Pool){}

  async handle(payload:any) {
    await this.pool.query(
      `insert into commerce.price_trend
       (product_model_id,currency,min_30d,max_30d,avg_30d,
        latest_amount,latest_observed_at,updated_at)
       select li.product_model_id,po.currency,
              min(po.amount),max(po.amount),avg(po.amount),
              (array_agg(po.amount order by po.observed_at desc))[1],
              max(po.observed_at),now()
         from commerce.listing li
         join commerce.price_observation po on po.listing_id=li.id
        where li.id=$1 and po.observed_at >= now()-interval '30 days'
        group by li.product_model_id,po.currency
       on conflict (product_model_id,currency)
       do update set min_30d=excluded.min_30d,max_30d=excluded.max_30d,
                     avg_30d=excluded.avg_30d,
                     latest_amount=excluded.latest_amount,
                     latest_observed_at=excluded.latest_observed_at,
                     updated_at=now()`,
      [payload.listingId],
    );
    return 'DONE' as const;
  }
}
