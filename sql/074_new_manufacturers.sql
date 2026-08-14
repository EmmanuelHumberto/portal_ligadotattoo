begin;

-- Corrige a fonte de ingestão da Bishop Rotary: site oficial, não a loja de suprimentos.
update ingestion.source
   set base_url='https://bishoprotary.com/', updated_at=now()
 where kind='MANUFACTURER' and name='Bishop Rotary'
   and base_url like '%bishoptattoosupply%';

-- Novos fabricantes oficiais (marcas que faltavam no catálogo).
insert into catalog.manufacturer (id,name,normalized_name,slug,official_website,status,version)
select gen_random_uuid(), v.name, lower(v.name), v.slug, v.website, 'ACTIVE', 1
from (values
  ('EZ Tattoo Supply','ez-tattoo-supply','https://eztattoosupply.com/'),
  ('DK Lab','dk-lab','https://dklablatam.com/'),
  ('AVA Machine','ava-machine','https://www.avamachine.com/'),
  ('Prodigy Company','prodigy-company','https://www.prodigycompanystore.com.br/')
) as v(name,slug,website)
where not exists (
  select 1 from catalog.manufacturer m where m.slug = v.slug
);

-- Fontes de ingestão correspondentes (descoberta e acompanhamento editorial).
insert into ingestion.source (id,name,kind,base_url,allowed_hosts,robots_policy,crawl_delay_ms,status,version)
select gen_random_uuid(), v.name, 'MANUFACTURER', v.website, v.hosts, 'RESPECT', 1000, 'ACTIVE', 1
from (values
  ('EZ Tattoo Supply','https://eztattoosupply.com/',
   '{eztattoosupply.com,www.eztattoosupply.com}'::text[]),
  ('DK Lab','https://dklablatam.com/',
   '{dklablatam.com,www.dklablatam.com}'::text[]),
  ('AVA Machine','https://www.avamachine.com/',
   '{www.avamachine.com,avamachine.com}'::text[]),
  ('Prodigy Company','https://www.prodigycompanystore.com.br/',
   '{www.prodigycompanystore.com.br,prodigycompanystore.com.br}'::text[])
) as v(name,website,hosts)
where not exists (
  select 1 from ingestion.source s where s.name = v.name and s.kind='MANUFACTURER'
);

commit;
