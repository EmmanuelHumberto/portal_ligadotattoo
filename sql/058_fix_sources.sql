begin;

-- BRNC: o domínio raiz resolve; "www." não
update ingestion.source
   set base_url='https://brnc.com/', allowed_hosts=ARRAY['brnc.com','www.brnc.com']
 where base_url='https://www.brnc.com/';
update ingestion.crawl_target
   set url='https://brnc.com/'
 where url='https://www.brnc.com/';

-- Bishop Rotary: o domínio antigo redireciona para bishoptattoosupply.com
update ingestion.source
   set base_url='https://www.bishoptattoosupply.com/',
       allowed_hosts=ARRAY['bishoptattoosupply.com','www.bishoptattoosupply.com']
 where base_url='https://www.bishoprotary.com/';
update ingestion.crawl_target
   set url='https://www.bishoptattoosupply.com/'
 where url='https://www.bishoprotary.com/';

-- Desativar fontes cujo domínio não resolve (ENOTFOUND)
update ingestion.source set status='DISABLED'
 where base_url in (
  'https://www.piratetattoo.se/',
  'https://www.ava-tattoo.com/',
  'https://www.sobatattoo.com/',
  'https://www.bavarian-custom-irons.de/',
  'https://www.poseidon-tattoo.com/',
  'https://www.protattoosupplies.com/'
 );

update ingestion.crawl_target set status='DISABLED'
 where source_id in (
  select id from ingestion.source
   where base_url in (
    'https://www.piratetattoo.se/',
    'https://www.ava-tattoo.com/',
    'https://www.sobatattoo.com/',
    'https://www.bavarian-custom-irons.de/',
    'https://www.poseidon-tattoo.com/',
    'https://www.protattoosupplies.com/'
   )
 );

commit;
