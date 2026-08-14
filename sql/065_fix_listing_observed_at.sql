begin;

-- A migration 064 criou listings reais sem last_observed_at; o job
-- commerce.mark_stale os marcou como STALE imediatamente. Restaura para ACTIVE
-- e registra a observação inicial.
update commerce.listing
   set status='ACTIVE',last_observed_at=now(),updated_at=now(),version=version+1
 where status='STALE' and last_observed_at is null;

commit;
