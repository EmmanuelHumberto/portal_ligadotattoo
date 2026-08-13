import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class CommercePublicQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async offers(slug:string) {
    const r = await this.pool.query(
      `select s.name seller,po.amount,po.currency,li.url,li.availability,
              po.observed_at
         from catalog.product_model p
         join commerce.listing li on li.product_model_id=p.id
         join commerce.seller s on s.id=li.seller_id
         join lateral (
           select amount,currency,observed_at
             from commerce.price_observation x
            where x.listing_id=li.id
            order by observed_at desc limit 1
         ) po on true
        where p.slug=$1 and li.status='ACTIVE'
        order by po.amount`,
      [slug],
    );
    return { items:r.rows.map(x => ({
      seller:x.seller,amount:Number(x.amount),currency:x.currency,
      url:x.url,availability:x.availability,observedAt:x.observed_at,
    })) };
  }

  async priceHistory(slug:string, window='90d') {
    const intervals:Record<string,string> = {
      '30d':'30 days','90d':'90 days','180d':'180 days',
      '1y':'1 year','all':'100 years',
    };
    const interval = intervals[window] ?? intervals['90d'];
    const r = await this.pool.query(
      `select po.amount,po.currency,po.observed_at
         from catalog.product_model p
         join commerce.listing li on li.product_model_id=p.id
         join commerce.price_observation po on po.listing_id=li.id
        where p.slug=$1 and po.observed_at >= now() - $2::interval
        order by po.observed_at`,
      [slug,interval],
    );
    const observations = r.rows.map(x => ({
      amount:Number(x.amount),observedAt:x.observed_at,
    }));
    const first = observations[0]?.amount;
    const last = observations.at(-1)?.amount;
    const changePercent =
      first != null && last != null && first !== 0
        ? ((last-first)/first)*100 : null;
    return {
      currency:r.rows[0]?.currency ?? null,
      changePercent,
      observations,
    };
  }
}
