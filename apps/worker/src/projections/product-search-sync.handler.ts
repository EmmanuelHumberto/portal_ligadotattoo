import { Pool } from 'pg';

/**
 * Re-projeta todos os produtos do catálogo para a tabela de busca
 * (search.search_document). Usado para recuperar a indexação quando a
 * ingestão cria produtos sem emitir eventos de outbox.
 */
export class ProductSearchSyncHandler {
  readonly type = 'projection.product_search_sync';

  constructor(private readonly pool:Pool) {}

  async handle() {
    const r = await this.pool.query(
      `select p.id,p.name,p.slug,p.product_type_key,
              m.name manufacturer_name,b.name brand_name
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
        where p.lifecycle <> 'UNKNOWN'`,
    );
    for(const p of r.rows){
      const subtitle=[p.manufacturer_name,p.brand_name,p.product_type_key]
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
        [p.id,p.name,subtitle,`/maquinas/${p.slug}`],
      );
    }
    // remove documentos órfãos (produtos que não existem mais)
    await this.pool.query(
      `delete from search.search_document d
        where d.source_type='PRODUCT_MODEL'
          and not exists (
            select 1 from catalog.product_model p where p.id=d.source_id
          )`,
    );
    return 'DONE' as const;
  }
}
