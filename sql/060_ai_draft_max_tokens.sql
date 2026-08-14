begin;

-- O modelo de raciocínio consome o orçamento de saída com reasoning_content;
-- aumentar o teto evita content vazio em textos de entrada grandes.
update ai.workload_policy
   set max_output_tokens=8192
 where workload_key='editorial.draft';

commit;
