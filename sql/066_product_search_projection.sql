begin;

-- Projeta todos os modelos de produto no índice de busca, garantindo que um
-- reset limpo já venha com o catálogo pesquisável (equivalente ao
-- ProductSearchProjectionHandler, executado aqui como SQL idempotente).
insert into search.search_document
 (id,source_type,source_id,document_type,title,normalized_title,subtitle,
  public_url,is_public,search_vector,updated_at)
select p.id,'PRODUCT_MODEL',p.id,'PRODUCT',p.name,lower(p.name),
       nullif(concat_ws(' · ',m.name,b.name,p.product_type_key),''),
       '/maquinas/'||p.slug,true,
       setweight(to_tsvector('simple',coalesce(p.name,'')),'A') ||
       setweight(to_tsvector('simple',coalesce(
         nullif(concat_ws(' · ',m.name,b.name,p.product_type_key),''),'')),'B'),
       now()
  from catalog.product_model p
  join catalog.manufacturer m on m.id=p.manufacturer_id
  left join catalog.brand b on b.id=p.brand_id
on conflict (source_type,source_id)
do update set title=excluded.title,
              normalized_title=excluded.normalized_title,
              subtitle=excluded.subtitle,
              public_url=excluded.public_url,
              is_public=excluded.is_public,
              search_vector=excluded.search_vector,
              updated_at=now();

commit;
