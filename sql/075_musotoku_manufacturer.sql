begin;

-- Musotoku: fabricante oficial de ferramentas de tatuagem (fontes, baterias, máquinas).
insert into catalog.manufacturer (id,name,normalized_name,slug,official_website,status,version)
select gen_random_uuid(), 'Musotoku', 'musotoku', 'musotoku', 'https://musotoku.com/', 'ACTIVE', 1
where not exists (
  select 1 from catalog.manufacturer m where m.slug = 'musotoku'
);

-- Fonte de ingestão correspondente.
insert into ingestion.source (id,name,kind,base_url,allowed_hosts,robots_policy,crawl_delay_ms,status,version)
select gen_random_uuid(), 'Musotoku', 'MANUFACTURER', 'https://musotoku.com/',
       '{musotoku.com,www.musotoku.com}'::text[], 'RESPECT', 1000, 'ACTIVE', 1
where not exists (
  select 1 from ingestion.source s where s.name = 'Musotoku' and s.kind='MANUFACTURER'
);

commit;
