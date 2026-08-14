begin;

-- O modelo de raciocínio pode levar mais tempo; ampliar o timeout do draft.
update ai.workload_policy
   set timeout_ms=120000
 where workload_key='editorial.draft';

commit;
