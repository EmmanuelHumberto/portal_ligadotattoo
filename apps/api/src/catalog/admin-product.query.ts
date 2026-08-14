import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class AdminProductQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async list(limit=100, type?:string) {
    const typeFilter=type?.trim().toUpperCase() || null;
    const r=await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.model_code,
              p.lifecycle,p.version,p.created_at,p.updated_at,
              m.name manufacturer_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
        where ($1::text is null or p.product_type_key=$1)
        order by p.name limit $2`,
      [typeFilter, Math.min(Math.max(limit,1),200)],
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
    if (!r.rowCount) return null;
    const specs = await this.pool.query(
      `select property_key, value, unit
         from knowledge.canonical_fact
        where subject_type='PRODUCT_MODEL' and subject_id=$1
          and valid_to is null
          and property_key not in ('summary','description')
        order by property_key`,
      [id],
    );
    return { ...r.rows[0], specs: specs.rows };
  }
}
