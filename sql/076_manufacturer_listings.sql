begin;

-- Sellers oficiais para as marcas adicionadas sem seller (as migrations 069/074
-- criaram apenas catalog.manufacturer e ingestion.source). Sem seller o
-- persistProduct não cria listing, então a página do produto perde o link externo.
insert into commerce.seller (id,name,slug,website_url,status,public_freshness_interval)
select gen_random_uuid(), m.name, m.slug, m.official_website, 'ACTIVE', interval '7 days'
from catalog.manufacturer m
where m.name in ('EZ Tattoo Supply','DK Lab','AVA Machine','Prodigy Company')
  and not exists (select 1 from commerce.seller s where s.slug=m.slug);

-- Listings: um por produto, apontando para a URL original coletada na descoberta
-- (knowledge.claim.source_url), com fallback para o site oficial do fabricante.
-- Prefere a URL mais específica (página do produto) pela heurística de comprimento.
insert into commerce.listing (
  id,seller_id,product_model_id,external_id,url,normalized_url,
  affiliate_mode,availability,status,last_observed_at,version
)
select gen_random_uuid(), s.id, p.id, p.slug,
       coalesce(best.url, m.official_website),
       coalesce(best.url, m.official_website),
       'NONE', 'IN_STOCK', 'ACTIVE', now(), 1
from catalog.product_model p
join catalog.manufacturer m on m.id=p.manufacturer_id
join commerce.seller s on s.slug=m.slug
left join lateral (
  select cl.source_url as url
    from knowledge.claim cl
   where cl.subject_id=p.id and cl.subject_type='PRODUCT_MODEL'
     and cl.source_url is not null and cl.source_url like 'http%'
   order by length(cl.source_url) desc, cl.observed_at desc
   limit 1
) best on true
where m.name in ('EZ Tattoo Supply','DK Lab','AVA Machine','Prodigy Company')
  and not exists (
    select 1 from commerce.listing li where li.product_model_id=p.id
  );

commit;
