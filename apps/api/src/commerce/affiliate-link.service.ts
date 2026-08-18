import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class AffiliateLinkService {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async outbound(listingId:string) {
    const r=await this.pool.query(
      `select li.url,li.affiliate_mode,s.affiliate_template,s.status seller_status,
              li.status listing_status,p.lifecycle product_lifecycle
         from commerce.listing li
         join commerce.seller s on s.id=li.seller_id
         join catalog.product_model p on p.id=li.product_model_id
        where li.id=$1`,[listingId],
    );
    if (!r.rowCount) return null;
    const x=r.rows[0];
    if (x.seller_status!=='ACTIVE' || x.listing_status!=='ACTIVE' ||
        x.product_lifecycle==='UNKNOWN') return null;

    if (x.affiliate_mode==='TEMPLATE' && x.affiliate_template) {
      return x.affiliate_template.replace(
        '{url}',encodeURIComponent(x.url),
      );
    }
    return x.url;
  }
}
