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
              po.availability,po.observed_at,li.url listing_url,
              (po.observed_at is not null
               and po.observed_at >= now() - s.public_freshness_interval) price_fresh
         from catalog.product_model p
         join commerce.listing li on li.product_model_id=p.id
         join commerce.seller s on s.id=li.seller_id
         left join lateral (
           select amount,currency,availability,observed_at
             from commerce.price_observation x
            where x.listing_id=li.id order by observed_at desc limit 1
         ) po on true
        where p.slug=$1 and li.status='ACTIVE' and s.status='ACTIVE'
        order by po.amount nulls last`,
      [slug],
    );
    return {items:r.rows.map(x=>({
      listingId:x.listing_id,seller:x.seller,
      amount:x.price_fresh && x.amount!=null ? Number(x.amount) : null,
      currency:x.price_fresh ? x.currency : null,
      availability:x.availability,
      observedAt:x.observed_at,
      storeDomain:domainOf(x.listing_url),
      outboundUrl:`/go/listing/${x.listing_id}`,
    }))};
  }

  async publicOfferFeed(input:{limit?:number;cursor?:string}) {
    const limit=Math.min(Math.max(input.limit??24,1),100);
    const params:unknown[]=[];
    const cursorClause=input.cursor
      ? (params.push(input.cursor),`and li.id>$${params.length}::uuid`):'';
    params.push(limit+1);
    const result=await this.pool.query(
      `select li.id listing_id,p.id product_id,p.slug product_slug,
              p.name product_name,p.product_type_key,
              m.name manufacturer_name,m.slug manufacturer_slug,
              s.name seller,po.amount,po.currency,po.availability,po.observed_at
         from commerce.listing li
         join catalog.product_model p on p.id=li.product_model_id
         join catalog.manufacturer m on m.id=p.manufacturer_id
         join commerce.seller s on s.id=li.seller_id
         join lateral (
           select amount,currency,availability,observed_at
             from commerce.price_observation x
            where x.listing_id=li.id order by observed_at desc limit 1
         ) po on true
        where li.status='ACTIVE' and s.status='ACTIVE'
          and p.lifecycle<>'UNKNOWN'
          and po.observed_at>=now()-s.public_freshness_interval
          ${cursorClause}
        order by li.id
        limit $${params.length}`,
      params,
    );
    const hasMore=result.rows.length>limit;
    const rows=result.rows.slice(0,limit);
    return {
      items:rows.map(x=>({
        listingId:x.listing_id,
        product:{
          id:x.product_id,slug:x.product_slug,name:x.product_name,
          type:x.product_type_key,
          manufacturer:{name:x.manufacturer_name,slug:x.manufacturer_slug},
        },
        seller:x.seller,amount:Number(x.amount),currency:x.currency,
        availability:x.availability,observedAt:x.observed_at,
        outboundUrl:`/go/listing/${x.listing_id}`,
      })),
      meta:{hasMore,nextCursor:hasMore?rows.at(-1)?.listing_id??null:null},
    };
  }

  async compareOffers(ids:string[]) {
    if(!ids.length)return {items:[]};
    const r=await this.pool.query(
      `select li.id listing_id,p.id product_id,p.slug product_slug,
              p.name product_name,p.product_type_key,
              m.name manufacturer_name,m.slug manufacturer_slug,
              s.name seller,po.amount,po.currency,po.availability,po.observed_at
         from commerce.listing li
         join catalog.product_model p on p.id=li.product_model_id
         join catalog.manufacturer m on m.id=p.manufacturer_id
         join commerce.seller s on s.id=li.seller_id
         join lateral (
           select amount,currency,availability,observed_at
             from commerce.price_observation x
            where x.listing_id=li.id order by observed_at desc limit 1
         ) po on true
        where li.id=any($1::uuid[])
        order by array_position($1::uuid[],li.id)`,
      [ids],
    );
    return {items:r.rows.map(x=>({
      listingId:x.listing_id,
      product:{
        id:x.product_id,slug:x.product_slug,name:x.product_name,
        type:x.product_type_key,
        manufacturer:{name:x.manufacturer_name,slug:x.manufacturer_slug},
      },
      seller:x.seller,amount:Number(x.amount),currency:x.currency,
      availability:x.availability,observedAt:x.observed_at,
      outboundUrl:`/go/listing/${x.listing_id}`,
    }))};
  }
}

function domainOf(url:string|null|undefined):string|null {
  if(!url)return null;
  try {
    const u=new URL(url);
    return u.hostname.replace(/^www\./,'');
  } catch {
    return null;
  }
}
