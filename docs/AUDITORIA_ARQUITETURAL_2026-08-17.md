# Auditoria arquitetural — Portal Liga do Tattoo

Data: 2026-08-17
Escopo: estado atual do workspace, incluindo alterações locais não commitadas
Conclusão: **refatorar por estrangulamento; não reescrever**
Prontidão de produção: **NO-GO**

## Resumo executivo

A arquitetura não perdeu sua identidade. A separação Web/API/Worker, PostgreSQL
como fonte durável, jobs/outbox, OIDC/JWKS, safe fetch, media storage e o modelo
de capabilities são bases reaproveitáveis. Os fluxos transacionais originais de
knowledge, editorial e commerce também mostram boa direção.

O afastamento é material em quatro áreas: descoberta de catálogo contorna a
governança, contratos deixaram de acompanhar as APIs, composição virou um
monólito interno e controles de produção não refletem completamente o código
executado. A implementação recente priorizou colocar dados reais no portal e
acabou fazendo atalhos exatamente nas invariantes que definiam confiança.

Uma reescrita total custaria mais, demoraria mais e provavelmente recriaria os
mesmos riscos sem os testes, migrations e operação já existentes. A ação correta
é interromper novos atalhos, corrigir os bloqueadores e refatorar verticalmente.

## Grau de aderência por área

| Área | Aderência | Avaliação |
|---|---:|---|
| Topologia Web/API/Worker | 8/10 | Separação de processos continua clara |
| IAM e capabilities | 7/10 | OIDC real é sólido; caminho dev precisa bloqueio de produção |
| Jobs/outbox/worker | 7/10 | Base durável boa; composição e handlers cresceram demais |
| Catálogo/knowledge/proveniência | 3/10 | Descoberta promove fonte diretamente a verdade pública |
| Mídia/direitos | 4/10 | Storage/delivery bons; descoberta concede direitos automaticamente |
| IA Provider Hub | 4/10 | Hub existe, mas há stack legada e chamada DeepSeek fora dele |
| Contratos/API | 3/10 | OpenAPI, manifests e runtime divergem; `any` domina fronteiras |
| Web/componentes | 6/10 | RSC e componentes úteis; tipagem e view models são frágeis |
| Segurança/operabilidade | 5/10 | Bons controles pontuais; alguns estão órfãos ou só documentados |
| Testes/gates | 5/10 | 100 testes passam, mas integrações pulam e o gate atual falha |

A nota global aproximada é **5,2/10**. Isso significa "base recuperável com
refatoração relevante", não "código descartável".

## Achados bloqueadores

### P0 — autoridade e confiança

1. `CatalogDiscoveryHandler.recordFact` cria claim, proposta já `APPROVED` e
   `canonical_fact` diretamente. Isso viola INV-01 e o onboarding, que proíbem
   scraping → verdade canônica.
2. A mesma descoberta cria `product_model` como `ACTIVE`, listings públicas e
   imagens `PERMITTED/ACTIVE`, decididas por `system`. O novo descobridor de
   documentos repete a promoção automática para PDFs. Fonte pública não equivale
   a licença nem revisão de direitos.
3. `CatalogTranslateHandler` chama DeepSeek fora do Provider Hub e altera o valor
   de `canonical_fact` diretamente. Viola seleção configurável, registro de custo
   e proibição de IA → autoridade.
4. A página de produto chama todo dado não-fixture de "verificado por humanos".
   Essa afirmação não é derivada de decisão/revisão e pode ser falsa.

Recomendação: novos itens descobertos devem entrar como `DISCOVERED/PENDING`, com
snapshot, claims e direitos `UNKNOWN/PENDING`. A projeção pública só deve consumir
estado promovido por um caso de uso de governança. Se o produto desejar confiar
automaticamente em fabricantes allowlisted, isso exige uma ADR explícita que
altere o modelo de autoridade; hoje os documentos se contradizem.

### P0/P1 — segurança e integridade

1. `DEV_ADMIN_TOKEN` funciona sempre que OIDC está ausente, sem exigir ambiente
   não produtivo. `/dev-login` também é compilado para produção, grava o token em
   cookie sem `secure` e não verifica `NODE_ENV`. Uma configuração acidental cria
   um administrador com todas as capabilities.
2. `OriginCsrfGuard` é provider/export, mas não é `APP_GUARD` nem usado por
   controllers. Documentos afirmam que é global. O modelo atual é Bearer
   server-side, mas a proteção documentada e a executada não são a mesma.
3. Controllers de catálogo/editorial/comércio executam sequências de SQL sem
   transação, audit ou outbox. Falha intermediária deixa dados parciais; mudanças
   privilegiadas relevantes podem não aparecer na auditoria.
4. Decompressão HTTP limita bytes comprimidos, não bytes após `gzip/br/deflate`.
   Isso reabre consumo descontrolado de memória por bomba de compressão. Erros de
   decompressão são ignorados e o conteúdo comprimido segue para parsers.

## Contratos e APIs

### Drift comprovado

- `portal.openapi.yaml` declara servidor `/api/v1`; a API não configura prefixo.
- O OpenAPI cobre uma fração das rotas atuais e ainda declara operações que não
  existem com aquela forma (`GET /admin/manufacturers`, providers/routing de IA,
  `POST /admin/ingestion/acquisitions`).
- Rotas reais ausentes do contrato incluem facets/compare, manufacturers públicos,
  feed/compare de ofertas, ingestão manual, crawl targets, configuração editorial,
  temas, candidatos, upload, operações, intelligence e múltiplas mutações.
- Há pares evolutivos sem política de remoção: `offers`/`offers-v2`, dois endpoints
  de rights de mídia, duas famílias de health e `catalog.controller.v2.ts` servindo
  uma rota sem versão.
- O `ProblemDetailsFilter` existe, mas não é registrado; `ApiProblem` é um facade
  de duas linhas e não governa respostas reais.
- Não há `ValidationPipe` global nem DTOs runtime nas entradas. Muitos `@Body`,
  payloads de job, componentes e respostas usam `any`.

### Contratos compartilhados

O repositório contém cerca de 14 mil linhas TypeScript/TSX nos três apps. Em
contraste, `packages/contracts` possui aproximadamente 23 linhas e é importado
somente por três arquivos da stack antiga de IA; Web e Worker não o usam. Os
diretórios `api-client`, `database`, `domain-kernel` e `ui` não são workspaces
reais (não têm `package.json`). A topologia descrita é mais aspiracional que
executável.

Recomendação: reconciliar primeiro o OpenAPI a partir do comportamento desejado,
adicionar DTOs/validação e gerar cliente/tipos. Não expandir `contracts` como
depósito de modelos internos.

## Componentização

### O que está bem colocado

- apps separados e composition roots explícitos;
- módulos por domínio em diretórios claros;
- ports para AI e media storage/delivery;
- handlers transacionais originais com repositories/outbox/audit;
- Server Components para leitura inicial e componentes compartilhados no Admin;
- Worker separado do request path.

### Onde a componentização é nominal

- `FeaturesModule` registra quase todos os controllers/providers da API;
- oito controllers injetam Pool e acumulam aplicação/persistência;
- `catalog-discovery.handler.ts` tem cerca de 700 linhas e pelo menos seis
  responsabilidades;
- `public-product.query.ts` (≈340 linhas) e `catalog.controller.v2.ts` (≈312)
  concentram mudanças frequentes;
- `processors.ts` instancia manualmente toda a infraestrutura;
- o Web ainda usa `any` em quase todas as superfícies públicas e mistura estilos
  inline em páginas;
- CSS é fisicamente separado, mas fortemente global/minificado por linha, sem
  ownership de feature.

A decisão aplicável está em `ADR-0002-modularidade-progressiva.md`. Ela rejeita
tanto a reescrita quanto a fragmentação em microcomponentes sem fronteira real.

## IA e custo das funções de descoberta

### Mapa real

| Função | Usa IA? | Comportamento/custo |
|---|---|---|
| Descoberta de tópicos (Bing RSS) | Não | HTTP e banco apenas |
| Coleta/extrator de artigos | Não | Regex/HTML local; infraestrutura apenas |
| Descoberta de catálogo/Shopify/VTEX/sitemap | Não | HTTP, PostgreSQL e S3/MinIO |
| Extração de specs | Não | Regras regex locais |
| Descoberta de imagens/manuais/preços | Não | HTTP/storage; sem tokens |
| Rascunho editorial automático | Sim | 1 chamada por candidato novo/qualificado |
| Tradução de descrições do catálogo | Sim | DeepSeek direto, até 40 descrições por job; não é agendado automaticamente |
| Classificar/resumir/extrair evento | Configurado, não usado | custo atual zero |

O modelo ativo seedado é `deepseek-v4-flash`. Em 2026-08-17, o preço oficial é
US$ 0,14/M tokens de entrada sem cache e US$ 0,28/M de saída (cache hit:
US$ 0,0028/M). Fonte:
https://api-docs.deepseek.com/quick_start/pricing/

O draft corta a fonte em 20.000 caracteres e permite até 16.000 tokens de saída.
Usando uma carga típica de 6.000 tokens de entrada e 2.000 de saída:

`(6.000 × 0,14 + 2.000 × 0,28) / 1.000.000 = US$ 0,00140 por draft`

Um teto conservador de 10.000 tokens de entrada + 16.000 de saída custa
aproximadamente **US$ 0,00588 por tentativa**. Exemplos mensais, antes de dedup:

| Candidatos/mês | Típico | Teto por uma tentativa |
|---:|---:|---:|
| 100 | US$ 0,14 | US$ 0,59 |
| 750 (25/dia) | US$ 1,05 | US$ 4,41 |
| 3.000 (100/dia) | US$ 4,20 | US$ 17,64 |

Fallbacks/retries podem multiplicar a conta pelo número de tentativas, embora
hoje só exista uma rota/modelo efetivamente seedada. Para tradução, assumindo
1.500 tokens de entrada e 500 de saída, uma descrição custa ≈US$ 0,00035 e um
job de 40 custa ≈US$ 0,014.

### Por que o custo exibido hoje não é confiável

- o seed do modelo não preenche `input_cost_per_million` nem
  `output_cost_per_million`; o Hub registra custo zero;
- `GenerateAIDraftHandler` insere uma segunda linha em `ai.execution`, além da
  linha já gravada pelo Hub, duplicando contagem e deixando tokens nulos;
- a tradução direta não registra execução/tokens/custo;
- não há orçamento mensal, alerta ou métrica de custo por item publicado;
- policies `classify/summarize/extract_event` existem sem consumidores.

Antes de otimizar preço, corrigir o ledger: uma execução por chamada, preço
versionado por modelo, custo real retornado/estimado, tag de candidato e budgets
diário/mensal. O custo nominal é baixo; o risco atual é governança e medição,
não a fatura.

## Operação, infraestrutura e documentação

- Redis é provisionado/configurado, mas nenhum runtime o utiliza.
- Rate limiting é memória local; escala horizontal cria limites independentes.
- Há Compose raiz e `infra/compose.yml` com bancos/serviços diferentes; README
  aponta o segundo, mas o primeiro continua confundindo operação.
- Compose de produção usa imagens de infraestrutura mutáveis (`latest`/tags),
  contrariando a promoção por digest descrita nas invariantes.
- Docker runtime copia o workspace/node_modules inteiro do estágio de build,
  incluindo dependências de desenvolvimento.
- `database/migrations` é referência e `sql` é ativo, mas manifests antigos ainda
  apresentam o conjunto de referência como completo.
- Planos/status afirmam controles concluídos que não estão conectados (CSRF,
  contracts, Provider Hub único).

## Evidência do gate nesta auditoria

- TypeScript: passou.
- Testes: 100 passaram; 8 integrações foram ignoradas.
- Lint: falhou com 1 erro e 14 avisos no conjunto dos apps.
- `verify:full`: falhou no secret scan, que inclui `.next` e gera falso positivo
  a partir de source map. O scanner precisa ignorar artefatos e testar a rota dev
  real separadamente.
- E2E privilegiado/staging: sem evidência nova.

Portanto, "build local anteriormente verde" não deve ser interpretado como estado
verde atual nem como `IMPLEMENTATION_VERIFIED`.

## Reescrita versus refatoração

### Decisão: não reescrever

Reescrever perderia migrations, casos de uso válidos, hardening SSRF/JWKS,
operações e conhecimento já incorporado. A maioria dos problemas está em limites
identificáveis e pode ser estrangulada mantendo endpoints/jobs.

### Refatoração recomendada

Estimativa em engenharia (uma pessoa experiente, sem contar staging externo):

| Frente | Esforço aproximado |
|---|---:|
| Bloqueadores P0 (dev auth, autoridade, compressão, query quebrada) | 4–7 dias |
| Contratos OpenAPI, DTOs, validação e erros | 5–8 dias |
| Decompor descoberta + governança + direitos | 8–15 dias |
| Casos de uso transacionais/auditáveis fora dos controllers | 6–10 dias |
| Unificar AI Hub e corrigir ledger/budgets | 3–5 dias |
| Tipar Web e consolidar view models/componentes | 5–8 dias |
| Fitness functions e testes de integração/E2E | 5–8 dias |
| Total com sobreposição e estabilização | **5–8 semanas** |

Uma reescrita com paridade realista seria pelo menos **10–16 semanas**, com
risco superior e sem reduzir a dependência de decisões de produto/staging.

## Plano priorizado

### Semana 1 — conter risco

1. Bloquear `DEV_ADMIN_TOKEN`/`dev-login` fora de development/test.
2. Fazer descoberta gerar candidatos/claims/rights pendentes, não público.
3. Remover tradução direta do canônico e passar pelo Hub/proposta.
4. Corrigir limite de bytes descomprimidos e a query duplicada.
5. Corrigir lint/scanner e adicionar regressões para esses casos.

### Semanas 2–3 — contrato executável

1. Inventariar rotas reais e escolher v1 canônica.
2. Atualizar OpenAPI, DTOs, ValidationPipe e ProblemDetails global.
3. Gerar tipos/cliente e migrar primeiro Web público e Admin mutations.
4. Deprecar duplicatas com prazo.

### Semanas 3–6 — decomposição vertical

1. `catalog discovery`: acquisition → extraction → candidate → review/promotion.
2. Casos de uso de catálogo/editorial/comércio com TransactionManager/audit/outbox.
3. Módulos Nest por domínio e repositories explícitos.
4. AI Hub único, ledger confiável e budgets.

### Semanas 6–8 — produto e release

1. View models/componentes tipados e remoção progressiva de `any`.
2. Integrações reais, E2E OIDC, carga, backup/restore e rollback.
3. Reconciliar documentação/evidência e só então reconsiderar GO.

## Critério de saída

A refatoração está suficiente quando nenhum caminho de source/IA promove
autoridade sozinho, todas as mutações privilegiadas relevantes são transacionais
e auditáveis, OpenAPI coincide com runtime, custos de IA são reconciliáveis e os
gates rodam verdes em checkout limpo e em staging.
