begin;

-- Promove as fontes de fabricante (ingestion.source) para o catálogo,
-- para que a descoberta de máquinas e o matching de preços cubram essas marcas.
insert into catalog.manufacturer(id,name,normalized_name,slug,official_website,status,version)
select gen_random_uuid(),
       s.name,
       lower(s.name),
       lower(regexp_replace(s.name,'[^a-zA-Z0-9]+','-','g')),
       s.base_url,
       'ACTIVE',
       1
  from ingestion.source s
 where s.kind='MANUFACTURER'
   and s.status='ACTIVE'
   and not exists (
     select 1 from catalog.manufacturer m
      where lower(m.name)=lower(s.name)
   );

commit;
