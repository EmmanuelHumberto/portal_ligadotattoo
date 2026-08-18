# Execução do plano de refatoração — 2026-08-17

## Estado

- Fase 1, contenção de riscos: concluída no código.
- Fase 2, contrato executável: fronteiras mutáveis tipadas e contrato HTTP fechado.
- Migrations `085`, `086` e `087`: aplicadas no PostgreSQL do Portal em 5433.

## Entregue

- token e login de desenvolvimento bloqueados fora de development/test;
- limite seguro sobre bytes descomprimidos e rejeição de encoding inválido;
- descoberta cria produto `UNKNOWN`, listing `PAUSED`, proposta `PENDING` e
  direitos de mídia `PENDING`;
- consultas e redirects públicos rejeitam produtos/listings em quarentena;
- tradução de catálogo passa pelo Provider Hub e gera proposta revisável;
- execução duplicada de IA removida e preço DeepSeek seedado;
- stack legada paralela de IA removida;
- Problem Details registrado globalmente;
- scanner de segredos corrigido para ignorar artefatos de build;
- fitness functions impedem novos controllers com SQL, acesso direto a
  provedores de IA e promoção canônica/direitos pela descoberta;
- OpenAPI passou a apontar para a raiz real e as rotas de IA inexistentes foram
  substituídas pelas rotas executadas.
- auditor automático de contratos adicionado em `scripts/contract-audit.mjs` e
  promovido a gate estrito de `verify:static`;
- OpenAPI cobre as 94 operações HTTP reais, incluindo fronteiras públicas,
  administrativas e internas, sem rotas declaradas inexistentes;
- `ProductController` não acessa mais PostgreSQL: seis casos de uso cuidam de
  mídia, specs, tipo, metadados, nome e agendamento da descoberta;
- mutações de produto agora validam JSON/UUID/enums/limites, são transacionais,
  registram auditoria e emitem outbox quando aplicável;
- troca repetida de tipo mantém exatamente um `product_type` canônico atual,
  comprovado por integração no PostgreSQL 5433.
- claims, propostas canônicas e decisões agora usam contratos runtime tipados,
  validando UUIDs, evidências, URLs, datas, confiança e versão antes do domínio;
- fitness function impede novos `@Body(): any` e qualquer aumento do baseline
  legado enquanto a migração dos demais contextos avança.
- contexto editorial não possui mais SQL em controllers nem corpos `any`:
  criação, edição, workflow, IA, ingestão social, configuração e tópicos têm
  entradas runtime tipadas;
- edição de rascunho e ingestão social foram extraídas para casos de uso
  transacionais com auditoria; configuração e tópicos usam componentes próprios;
- mídia agora possui uma única decisão de direitos: histórico, fundamento,
  concorrência otimista, auditoria e outbox não podem mais ser contornados pela
  antiga rota paralela;
- ingestão valida fontes/alvos e impede cadastrar alvo fora dos hosts permitidos
  pela fonte; seus comandos foram extraídos dos controllers;
- commerce e analytics receberam contratos runtime para preço, URLs e eventos;
  datas inválidas, propriedades não permitidas e identificadores de sessão
  inseguros são rejeitados;
- nenhuma fronteira HTTP usa `any`, e a fitness function passa a proibir
  `@Body`, `@Actor` ou `@Req` sem tipo seguro;
- erros de domínio `NotFoundError` e `ConcurrentModificationError` agora são
  representados corretamente como HTTP 404 e 409, em vez de 500;
- OpenAPI foi consolidado em 93 operações após remover `rights-v2` e manter
  apenas a rota canônica de decisão de direitos.
- descoberta de catálogo foi decomposta em parser/classificador puro, writer de
  evidência/proposta e importador de mídia em quarentena; o orquestrador caiu de
  710 para 219 linhas e não pode exceder 250 pela fitness function;
- criação de produto `UNKNOWN` e listing `PAUSED` foi centralizada em writer
  transacional compartilhado pelas fontes Shopify, VTEX, sitemap e HTML;
- os componentes extraídos têm testes próprios para classificação, specs,
  links permitidos, propostas `PENDING` e direitos de mídia `PENDING`.
- o Provider Hub reserva orçamento atomicamente antes de cada chamada paga,
  usando lock transacional por workload para impedir estouro concorrente;
- cada tentativa e fallback possui ledger próprio com tokens, custo reservado,
  custo real estimado, latência, request ID do provedor, erro e timestamps;
- respostas JSON inválidas deixam de atravessar o contrato tipado: a tentativa é
  encerrada como falha contabilizada e somente então a próxima rota é avaliada;
- limites configurados no Portal são USD 0,01 por chamada e USD 0,25/dia +
  USD 5/mês por workload, exceto `editorial.draft`, com USD 1/dia + USD 20/mês;
- o painel administrativo de IA expõe consumo por orçamento, execuções
  consolidadas e tentativas individuais, incluindo falhas e fallbacks;
- a resposta financeira do painel está formalizada no OpenAPI, mantendo o
  inventário em 93 operações runtime e 93 operações documentadas.
- DTOs públicos do Web foram centralizados em `public-api-contracts.ts`; catálogo,
  detalhes, fabricantes, ofertas, comparação, busca, editorial, sitemap e JSON-LD
  não dependem mais de contratos implícitos;
- todas as leituras públicas pelo cliente server-side declaram o tipo de resposta,
  e cache, contextos React, filtros, blocos editoriais e dados estruturados não
  contêm mais `any` explícito;
- o OpenAPI foi corrigido para separar resumo e detalhe de produto e para descrever
  sugestões de busca como objetos, de acordo com o runtime real;
- a fitness function falha se `any` explícito voltar a ser introduzido no Web.

## Validação

`npm run verify:full` passou: migrations estáticas, arquitetura, contratos,
segredos, typecheck, lint, 130 testes e builds de API/Web/Worker. O lint ainda emite 9
avisos. Com a infraestrutura habilitada, os 111 testes passaram: as 8
integrações antes ignoradas foram executadas contra PostgreSQL 5433 e MinIO.
O build Web também passou com o `NODE_ENV` de build controlado pelo Next; carregar
`NODE_ENV=development` do `.env` durante `next build` é uma configuração inválida.

## Efeito da quarentena

Após a migration, o banco possui 1.450 produtos em `UNKNOWN`, 58 produtos
públicos, 4.446 propostas pendentes, 1.470 mídias pendentes e 72 permitidas.
O PostgreSQL pertencente ao outro projeto, em 5432, não foi acessado.

Os testes de integração revelaram que o registry completo consumia backlog real
em banco compartilhado. `OutboxDispatcher` e `JobRunner` agora aceitam IDs
opcionais para execução isolada. O único job temporariamente deixado `RUNNING`
pelos testes foi identificado e devolvido a `PENDING`.

## Próximo corte

1. executar E2E HTTP/OIDC com os três runtimes ativos;
2. eliminar os avisos restantes do Web e ampliar os testes de apresentação;
3. adicionar validação runtime dos DTOs recebidos pelo Web nos endpoints críticos.

O inventário agora fecha em 93 operações runtime e 93 operações no OpenAPI. O
gate falha tanto para endpoint não documentado quanto para operação declarada
que não exista no runtime.
