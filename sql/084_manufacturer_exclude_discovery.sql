-- Marca fabricantes que não devem ser rastreados na descoberta de catálogo
-- (revenda/white-label). Eles continuam listados em /marcas e mantêm
-- produtos não-máquina no catálogo; apenas não são percorridos pelo
-- catalog.discover_machines.
alter table catalog.manufacturer
  add column if not exists exclude_from_discovery boolean not null default false;

update catalog.manufacturer set exclude_from_discovery=true
 where slug in ('cni','hawink','solong','wormhole','peak-needles');
