# Migrations de banco — Portal Liga do Tattoo

Este diretório (`sql/`) é o **conjunto ativo** de migrations, aplicado em ordem
lexicográfica pelo runner `apps/api/src/platform/migrate.ts` (comando
`npm run db:migrate`). Cada arquivo é registrado na tabela `schema_migration`
após aplicação, de modo idempotente.

## Numeração esparsa

A numeração é **esparsa de propósito**: as faixas refletem a herança de
múltiplas frentes (ARs de arquitetura) e deixam espaço para inserção futura sem
renumeração. Os "buracos" (002–009, 011–019, etc.) são intencionais e **não**
indicam migrations ausentes.

| Faixa | Domínio |
|-------|---------|
| `001` | Plataforma base (schemas, `schema_migration`) |
| `010` | AI provider hub (base) |
| `020` | Placeholders de núcleo |
| `024`–`032` | IAM/worker/catálogo, busca de mídia, conhecimento canônico, automação editorial, ingestão segura, hub de IA, inteligência de preços, biblioteca de mídia, auditoria/operações |
| `040` | Analytics de produto |
| `046`–`048` | Runtime/scheduler/heartbeat do Worker |
| `049`–`050` | Serviço técnico + laboratório |
| `051`–`063` | Rotas DeepSeek, flag de auto-rascunho, seeds (fontes/fabricantes), dedup, correções e orçamento de saída da IA |

## Convenções

- Um comando `db:migrate` por migration; evite editar uma migration já aplicada
  (crie uma nova com o próximo número livre).
- Mudanças de **schema** e **dados de configuração** (seeds, correções de
  fontes) convivem no mesmo diretório; dados de configuração imutáveis usam
  `on conflict do nothing` para idempotência.
- `begin; ... commit;` explícito em cada arquivo.

## Esquema base (referência)

`database/migrations/` contém o **esquema base** original (arquivos com
timestamp, ex.: `20260812002000_create_iam.sql`). Ele documenta a estrutura
inicial dos schemas e **não** é executado pelo runner `db:migrate`; o conjunto
ativo para evolução é este `sql/`.
