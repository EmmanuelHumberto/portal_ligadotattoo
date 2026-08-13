import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class PublicProductQuery {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(input: {
    limit: number;
    cursor?: string;
    productType?: string;
    manufacturer?: string;
  }) {
    const limit = Math.min(Math.max(input.limit || 24, 1), 100);
    const params: unknown[] = [];
    const where: string[] = [`p.lifecycle <> 'UNKNOWN'`];

    if (input.productType) {
      params.push(input.productType);
      where.push(`p.product_type_key = $${params.length}`);
    }
    if (input.manufacturer) {
      params.push(input.manufacturer);
      where.push(`m.slug = $${params.length}`);
    }
    if (input.cursor) {
      params.push(input.cursor);
      where.push(`p.id > $${params.length}::uuid`);
    }
    params.push(limit + 1);

    const r = await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.lifecycle,
              m.name manufacturer_name,m.slug manufacturer_slug,
              b.name brand_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
        where ${where.join(' and ')}
        order by p.id
        limit $${params.length}`,
      params,
    );

    const hasMore = r.rows.length > limit;
    const rows = r.rows.slice(0, limit);
    return {
      items: rows.map(mapSummary),
      meta: {
        hasMore,
        nextCursor: hasMore ? rows.at(-1)?.id ?? null : null,
      },
    };
  }

  async bySlug(slug: string) {
    const base = await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.lifecycle,
              m.name manufacturer_name,m.slug manufacturer_slug,
              b.name brand_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
        where p.slug=$1`,
      [slug],
    );
    if (!base.rowCount) return null;
    const row = base.rows[0];

    const [facts, media, offer] = await Promise.all([
      this.pool.query(
        `select property_key, value, unit
           from knowledge.canonical_fact
          where subject_type='PRODUCT_MODEL'
            and subject_id=$1
            and valid_from <= now()
            and (valid_to is null or valid_to > now())
          order by property_key`,
        [row.id],
      ),
      this.pool.query(
        `select a.id,a.kind,a.public_url,a.alt_text,a.attribution
           from media.media_link l
           join media.media_asset a on a.id=l.media_asset_id
          where l.subject_type='PRODUCT_MODEL'
            and l.subject_id=$1
            and a.status='ACTIVE'
            and a.rights_status='PERMITTED'
          order by l.is_primary desc,l.sort_order,a.id`,
        [row.id],
      ),
      this.pool.query(
        `select min(po.amount) amount, min(po.currency) currency,
                max(po.observed_at) observed_at
           from commerce.listing li
           join commerce.price_observation po on po.listing_id=li.id
          where li.product_model_id=$1
            and li.status='ACTIVE'
            and po.observed_at >= now() - interval '7 days'`,
        [row.id],
      ),
    ]);

    return {
      ...mapSummary(row),
      machineType: row.product_type_key,
      summary: null,
      description: null,
      canonicalSpecifications: facts.rows.map(f => ({
        key: f.property_key,
        name: humanize(f.property_key),
        value: f.value,
        unit: f.unit,
      })),
      specifications: facts.rows.map(f => ({
        key: f.property_key,
        label: humanize(f.property_key),
        value: formatFact(f.value, f.unit),
      })),
      media: media.rows.map(m => ({
        id:m.id, kind:m.kind, url:m.public_url,
        alt:m.alt_text, attribution:m.attribution,
      })),
      heroMedia: media.rows[0] ? {
        url: media.rows[0].public_url,
        kind: media.rows[0].kind,
        attribution: media.rows[0].attribution,
      } : null,
      offersSummary: offer.rows[0]?.amount == null ? null : {
        fromAmount: Number(offer.rows[0].amount),
        currency: offer.rows[0].currency,
        observedAt: offer.rows[0].observed_at,
      },
    };
  }

  async facets() {
    const [brands, types] = await Promise.all([
      this.pool.query(
        `select m.slug value,m.name label,count(p.id)::int count
           from catalog.manufacturer m
           join catalog.product_model p on p.manufacturer_id=m.id
          where p.lifecycle <> 'UNKNOWN'
          group by m.slug,m.name order by m.name`,
      ),
      this.pool.query(
        `select product_type_key value,product_type_key label,count(*)::int count
           from catalog.product_model where lifecycle <> 'UNKNOWN'
          group by product_type_key order by product_type_key`,
      ),
    ]);
    return {
      brands: brands.rows,
      types: types.rows,
      applications: [],
      priceBands: [],
    };
  }

  async compare(ids: string[]) {
    if (!ids.length) return { items: [] };
    const rows = await this.pool.query(
      `select slug from catalog.product_model where id=any($1::uuid[])
        order by array_position($1::uuid[],id)`,
      [ids],
    );
    const items = await Promise.all(rows.rows.map((row) => this.bySlug(row.slug)));
    return { items: items.filter(Boolean) };
  }
}

function mapSummary(r: any) {
  return {
    id:r.id, slug:r.slug, name:r.name,
    manufacturer:r.manufacturer_name,
    manufacturerSlug:r.manufacturer_slug,
    brand:r.brand_name
      ? {name:r.brand_name}
      : {name:r.manufacturer_name},
    type:r.product_type_key,
    productType:r.product_type_key,
    lifecycle:r.lifecycle,
  };
}

function formatFact(value: unknown, unit: string | null) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return unit ? `${text} ${unit}` : text;
}

function humanize(key: string) {
  return key.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
}
