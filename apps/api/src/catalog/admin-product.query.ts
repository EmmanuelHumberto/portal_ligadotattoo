import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class AdminProductQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async list(limit=100) {
    const r=await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.model_code,
              p.lifecycle,p.version,p.created_at,p.updated_at,
              m.name manufacturer_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
        order by p.name limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }

  async byId(id:string) {
    const r=await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.model_code,
              p.lifecycle,p.version,p.created_at,p.updated_at,
              m.name manufacturer_name,
              coalesce((
                select a.id from media.media_link ml
                 join media.media_asset a on a.id=ml.media_asset_id
                where ml.subject_type='PRODUCT_MODEL' and ml.subject_id=p.id
                  and ml.is_primary
                order by ml.sort_order limit 1
              ),null) media_id,
              coalesce((
                select li.id from commerce.listing li
                where li.product_model_id=p.id order by li.created_at limit 1
              ),null) listing_id,
              coalesce((
                select li.url from commerce.listing li
                where li.product_model_id=p.id order by li.created_at limit 1
              ),null) listing_url
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
        where p.id=$1`,
      [id],
    );
    return r.rowCount ? r.rows[0] : null;
  }
}
