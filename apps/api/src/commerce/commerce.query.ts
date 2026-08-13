import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class CommerceQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async adminListings(input:{status?:string;sellerId?:string;limit?:number}) {
    const r=await this.pool.query(
      `select li.id,li.product_model_id,p.name product_name,
              li.seller_id,s.name seller_name,li.url,li.status,
              li.last_observed_at,li.version,
              po.amount latest_amount,po.currency latest_currency,
              po.availability
         from commerce.listing li
         join commerce.seller s on s.id=li.seller_id
         join catalog.product_model p on p.id=li.product_model_id
         left join lateral (
           select amount,currency,availability from commerce.price_observation x
            where x.listing_id=li.id order by observed_at desc limit 1
         ) po on true
        where ($1::text is null or li.status=$1)
          and ($2::uuid is null or li.seller_id=$2)
        order by li.updated_at desc limit $3`,
      [input.status ?? null,input.sellerId ?? null,
       Math.min(Math.max(input.limit ?? 50,1),200)],
    );
    return {items:r.rows};
  }

  async publicOffers(slug:string) {
    const r=await this.pool.query(
      `select li.id listing_id,s.name seller,po.amount,po.currency,
              po.availability,po.observed_at
         from catalog.product_model p
         join commerce.listing li on li.product_model_id=p.id
         join commerce.seller s on s.id=li.seller_id
         join lateral (
           select amount,currency,availability,observed_at
             from commerce.price_observation x
            where x.listing_id=li.id order by observed_at desc limit 1
         ) po on true
        where p.slug=$1 and li.status='ACTIVE' and s.status='ACTIVE'
          and po.observed_at >= now() - s.public_freshness_interval
        order by po.amount`,
      [slug],
    );
    return {items:r.rows.map(x=>({
      listingId:x.listing_id,seller:x.seller,amount:Number(x.amount),
      currency:x.currency,availability:x.availability,
      observedAt:x.observed_at,
      outboundUrl:`/go/listing/${x.listing_id}`,
    }))};
  }
}
