begin;

-- verbatim=true: post de fonte única (link) -> texto original, não modificar.
-- verbatim=false: post de tema -> a IA desenvolve a partir das fontes de consulta.
alter table editorial.story_candidate
  add column if not exists verbatim boolean not null default false;

commit;
