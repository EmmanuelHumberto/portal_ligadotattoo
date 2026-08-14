begin;

alter table ai.execution alter column provider_key drop not null;
alter table ai.execution alter column model_key drop not null;

commit;
