import { Pool } from 'pg';

export class ProductSearchProjectionHandler {
  readonly type = 'projection.product_search';

  constructor(private readonly pool:Pool) {}

  async handle(payload:any) {
    const productId = payload.productId;
    const r = await this.pool.query(
      `select p.id,p.name,p.slug,p.product_type_key,
              m.name manufacturer_name,b.name brand_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
        where p.id=$1`,
      [productId],
    );
    if (!r.rowCount) {
      await this.pool.query(
        `delete from search.search_document
          where source_type='PRODUCT_MODEL' and source_id=$1`,
        [productId],
      );
      return 'DONE' as const;
    }

    const p = r.rows[0];
    const subtitle = [p.manufacturer_name,p.brand_name,p.product_type_key]
      .filter(Boolean).join(' · ');

    await this.pool.query(
      `insert into search.search_document
       (id,source_type,source_id,document_type,title,normalized_title,subtitle,
        public_url,is_public,search_vector,updated_at)
       values ($1,'PRODUCT_MODEL',$1,'PRODUCT',$2,lower($2),$3,$4,true,
         setweight(to_tsvector('simple',coalesce($2,'')),'A') ||
         setweight(to_tsvector('simple',coalesce($3,'')),'B'),now())
       on conflict (source_type,source_id)
       do update set title=excluded.title,
                     normalized_title=excluded.normalized_title,
                     subtitle=excluded.subtitle,
                     public_url=excluded.public_url,
                     is_public=excluded.is_public,
                     search_vector=excluded.search_vector,
                     updated_at=now()`,
      [p.id,p.name,subtitle,`/produto/${p.slug}`],
    );
    return 'DONE' as const;
  }
}
