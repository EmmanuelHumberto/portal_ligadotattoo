begin;

-- Remove as fontes inválidas (desativadas por domínio inexistente) e dependências.

delete from ingestion.extraction
 where snapshot_id in (
   select id from ingestion.snapshot
    where source_id in (select id from ingestion.source where status='DISABLED')
 );

delete from ingestion.snapshot
 where source_id in (select id from ingestion.source where status='DISABLED');

delete from ingestion.run
 where source_id in (select id from ingestion.source where status='DISABLED');

delete from ingestion.crawl_target
 where source_id in (select id from ingestion.source where status='DISABLED');

delete from ingestion.source
 where status='DISABLED';

commit;
