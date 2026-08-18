# Manual do Portal Liga do Tattoo

Atualizado em 17 de agosto de 2026. Este documento descreve o que está
implementado no repositório atual e como executar o Portal localmente.

## 1. Estado atual

O Portal é um monorepo com três runtimes:

| Componente | Tecnologia | Função |
|---|---|---|
| Web | Next.js 16 / React 19 | Portal público, Admin e proxies server-side |
| API | NestJS 11 | Contratos HTTP, autorização e casos de uso |
| Worker | Node.js / TypeScript | Jobs, outbox, ingestão, mídia e agendamentos |

Serviços de infraestrutura:

- PostgreSQL 16: dados do Portal, jobs, outbox, auditoria e ledger de IA;
- MinIO/S3: originais privados, documentos e variantes de mídia;
- Redis: provisionado no ambiente local para evolução da plataforma;
- provedores externos de IA: opcionais, acessados somente pela API.

O núcleo local compila e passa pelos gates automatizados. Staging e produção
ainda não estão aprovados: faltam OIDC real, execução E2E privilegiada,
observabilidade externa, backup/restore e evidências de release.

## 2. Subida rápida no ambiente atual

### 2.1 Pré-requisitos

- Node.js 20 ou superior;
- npm 11 ou superior;
- Docker Engine com Docker Compose;
- portas livres: `3000`, `3001`, `5433`, `6379`, `9000` e `9001`.

Neste computador existem dois PostgreSQL. O Portal usa exclusivamente a porta
`5433`. A porta `5432` pertence ao COUS/OpenTracy e não deve ser alterada,
migrada ou usada pelos comandos do Portal.

### 2.2 Entrar no repositório

```bash
cd /home/hiatus/Projetos/ligadotattoo/Portal_ligadotattoo/repository
```

### 2.3 Preparar o `.env`

Se o arquivo ainda não existir:

```bash
cp .env.example .env
```

Para este ambiente, confirme no `.env`:

```dotenv
POSTGRES_PORT=5433
DATABASE_URL=postgres://portal:SENHA_DO_PORTAL@localhost:5433/portal
PORT_API=3001
API_INTERNAL_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Não copie credenciais do banco do COUS. Para verificar o destino sem imprimir
usuário ou senha:

```bash
node --env-file=.env -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname,port:u.port,database:u.pathname.slice(1)})"
```

O resultado esperado neste computador é `localhost`, porta `5433`, banco
`portal`.

### 2.4 Instalar dependências

```bash
npm ci
```

### 2.5 Subir PostgreSQL, Redis e MinIO

O Compose canônico de desenvolvimento é `infra/compose.yml`:

```bash
docker compose -f infra/compose.yml up -d postgres redis minio
docker compose -f infra/compose.yml ps
```

O arquivo `.env` na raiz fornece `POSTGRES_PORT=5433` ao Compose.

### 2.6 Carregar as variáveis no terminal

```bash
set -a
. ./.env
set +a
```

Esse passo precisa ser repetido em cada terminal novo usado para iniciar API,
Web, Worker, migrations ou bootstrap.

### 2.7 Aplicar migrations

```bash
npm run db:migrate
```

O migrador é incremental e registra cada arquivo aplicado. A cadeia atual
possui 55 migrations. Antes de executar, sempre confirme que `DATABASE_URL`
aponta para `5433` neste computador.

### 2.8 Executar bootstrap

Sem criar catálogo sintético:

```bash
npm run bootstrap
```

Com fixtures para navegação e testes locais:

```bash
BOOTSTRAP_FIXTURES=true npm run bootstrap
```

Fixtures são idempotentes, identificadas como sintéticas na interface e
bloqueadas quando `NODE_ENV=production`.

### 2.9 Iniciar o Portal

```bash
npm run dev
```

Esse comando inicia Web, API e Worker no mesmo terminal. Use `Ctrl+C` para
encerrar os três runtimes.

Endereços:

| Serviço | Endereço |
|---|---|
| Portal | `http://localhost:3000` |
| Admin | `http://localhost:3000/admin` |
| API liveness | `http://localhost:3001/health/live` |
| API readiness | `http://localhost:3001/health/ready` |
| MinIO S3 | `http://localhost:9000` |
| Console MinIO | `http://localhost:9001` |

### 2.10 Login administrativo local

O Admin é fechado por padrão. Para desenvolvimento, configure um valor forte e
local em `DEV_ADMIN_TOKEN` no `.env`, reinicie API e Web e abra:

```text
http://localhost:3000/dev-login
```

O Web grava o token em cookie `HttpOnly` e a API o valida. Esse mecanismo só é
aceito com `NODE_ENV=development` ou `test`; em produção ele causa falha de
inicialização e `/dev-login` responde 404.

Se `DEV_ADMIN_TOKEN` estiver vazio e OIDC não estiver configurado, as rotas
administrativas permanecem em modo fail-closed, respondendo 401.

## 3. Funcionalidades públicas

### 3.1 Página inicial

- apresentação do Portal;
- acesso direto ao catálogo de máquinas e conteúdo editorial;
- cabeçalho global e busca.

Rota: `/`.

### 3.2 Catálogo técnico

- listagem paginada por cursor;
- filtro por fabricante e tipo de produto;
- áreas específicas para máquinas, fontes/baterias, acessórios, cartuchos e
  tintas;
- cards com fabricante, tipo, imagem autorizada e menor preço recente;
- produtos em quarentena (`lifecycle=UNKNOWN`) não aparecem publicamente.

Rotas:

- `/maquinas`;
- `/fontes`;
- `/acessorios`;
- `/cartuchos`;
- `/tintas`.

### 3.3 Detalhe de produto

- nome, fabricante, tipo e ciclo de vida;
- galeria com URLs privadas assinadas;
- resumo, descrição e ficha técnica canônica;
- indicação explícita quando os dados são fixtures sintéticas;
- manuais e documentos autorizados;
- ofertas recentes e redirecionamento controlado para o vendedor;
- inclusão no comparador.

Rota: `/maquinas/{slug}`.

### 3.4 Comparação

- comparação de até quatro produtos;
- tabela de especificações;
- menor preço conhecido;
- gráfico radar quando existem pelo menos dois eixos numéricos;
- comparação de até quatro ofertas, com normalização aproximada para USD e
  destaque do menor preço.

Rotas: `/comparar` e `/comparar-ofertas`.

### 3.5 Fabricantes

- listagem de fabricantes ativos;
- país, favicon derivado do site oficial e quantidade de produtos públicos;
- página individual com produtos do fabricante e link oficial.

Rotas: `/marcas` e `/marcas/{slug}`.

### 3.6 Busca e descoberta

- busca textual por produtos, fabricantes e conteúdo;
- autocomplete hidratado no navegador;
- links para a URL pública canônica;
- paginação por cursor no contrato da API.

Rota: `/buscar`.

### 3.7 Editorial

- feeds separados para notícias, blog técnico e eventos;
- detalhes com parágrafos, títulos, imagens, citações, callouts e passos;
- dados de evento: data, local e status;
- JSON-LD de artigo, notícia, evento e produto;
- sitemap e robots públicos.

Rotas:

- `/noticias` e `/noticias/{slug}`;
- `/blog` e `/blog/{slug}`;
- `/eventos` e `/eventos/{slug}`;
- `/sitemap.xml` e `/robots.txt`.

### 3.8 Ofertas e saída afiliada

- feed apenas de ofertas consideradas recentes pela política do vendedor;
- preço, moeda, disponibilidade, vendedor e momento de observação;
- saída pela rota `/go/listing/{id}`, que valida o listing antes de redirecionar;
- links marcados como `nofollow sponsored`.

Rota de listagem: `/ofertas`.

### 3.9 Analytics

- eventos de navegação permitidos por contrato;
- identificador anônimo de sessão;
- filtragem de propriedades sensíveis;
- coleta de Web Vitals;
- rate limiting e hashing independente para analytics.

## 4. Funcionalidades administrativas

Todas as páginas abaixo exigem Bearer OIDC válido ou o token local de
desenvolvimento. O Web lê a sessão server-side e não expõe o token ao JavaScript
do navegador.

### 4.1 Dashboard — `/admin`

- contadores de jobs, IA, ingestões e mídias;
- situação do outbox e dos Workers;
- agenda de publicação e alvos de coleta;
- estado atualizado da operação.

### 4.2 Produtos — `/admin/produtos`

- listar e filtrar produtos;
- criar produto manual;
- abrir detalhe administrativo;
- renomear sem alterar o slug;
- reclassificar tipo;
- alterar código do modelo, ciclo de vida e datas;
- editar resumo, descrição e ficha técnica por categoria;
- anexar imagem;
- editar URL de listing;
- solicitar execução da descoberta de catálogo.

Mutações são validadas, transacionais, auditadas e emitem outbox quando
aplicável.

### 4.3 Editorial — `/admin/editorial`

- criar notícias, posts, eventos e rascunhos;
- importar postagem de rede social como candidato/rascunho;
- editar título, subtítulo, resumo e corpo;
- enviar e anexar imagem;
- fluxo `DRAFT → IN_REVIEW → APPROVED → SCHEDULED/PUBLISHED`;
- aprovar com motivo, publicar, agendar, despublicar e remover;
- controle otimista por versão para evitar sobrescrita concorrente;
- candidatos editoriais e geração de rascunho assistida por IA;
- temas de descoberta editorial;
- habilitar/desabilitar e executar auto-draft.

Subáreas: `/admin/editorial/candidatos`, `/admin/editorial/temas` e
`/admin/editorial/{id}`.

### 4.4 Conhecimento — `/admin/conhecimento`

- registrar alegações com origem, valor, confiança e evidência;
- criar proposta de fato canônico;
- revisar proposta, sujeito, conflito, fato vigente e evidências;
- aprovar, rejeitar ou aprovar corrigindo o valor;
- histórico e controle otimista por versão.

A descoberta automática nunca promove diretamente um fato canônico; ela cria
propostas pendentes para decisão humana.

### 4.5 Fontes e ingestão

Em `/admin/fontes`:

- cadastrar fonte;
- definir política de robots e atraso de crawl;
- cadastrar URL-alvo, modo de descoberta e agenda;
- consultar fontes e alvos.

Em `/admin/ingestao`:

- acompanhar execuções e descobertas;
- forçar coleta de notícias;
- observar status e diagnósticos de aquisição.

A aquisição externa usa apenas HTTPS, hosts permitidos, DNS validado e pinado,
limites de redirects, tamanho e tempo. Endereços privados e loopback são
rejeitados para mitigar SSRF.

### 4.6 Mídia — `/admin/midia`

- biblioteca de ativos e fila de revisão;
- upload JPG, PNG, WebP, AVIF e PDF;
- validação de MIME, magic bytes e tamanho;
- geração assíncrona de variantes WebP `thumb`, `card` e `hero`;
- decisão única de direitos com fundamento obrigatório;
- histórico, auditoria, expiração e concorrência otimista.

Ativos novos começam com direitos `UNKNOWN`/`PENDING`. Somente mídia `ACTIVE`
com decisão vigente `PERMITTED` recebe URL assinada e aparece publicamente.

### 4.7 Comércio — `/admin/comercio`

- listar listings, vendedores, preço e disponibilidade;
- registrar nova observação de preço;
- editar URL de listing pelo detalhe do produto;
- acompanhar envelhecimento das ofertas.

### 4.8 IA Hub — `/admin/ia`

- consumo diário por workload e limite configurado;
- execuções consolidadas, latência, tokens e custo estimado;
- ledger individual por tentativa;
- visualização de fallback, custo reservado, custo real estimado e erro;
- modelos e rotas ficam no registry da API, sem expor secrets.

Workloads atualmente conectados ao produto:

- `editorial.draft`;
- `catalog.translate`.

Há políticas registradas também para classificação, resumo e extração de
eventos. Os limites atuais são:

| Política | Por chamada | Diário | Mensal |
|---|---:|---:|---:|
| `editorial.draft` | USD 0,01 | USD 1,00 | USD 20,00 |
| demais workloads | USD 0,01 | USD 0,25 | USD 5,00 |

O Hub reserva orçamento atomicamente antes de chamar o provedor. Respostas JSON
inválidas são contabilizadas como falha e podem acionar a próxima rota. Os
valores são estimativas baseadas no preço configurado no registry, não a fatura
oficial do provedor.

### 4.9 Operações — `/admin/operacoes`

- jobs `PENDING`, `RUNNING`, `RETRY`, `DONE` e `DEAD`;
- outbox e tentativas de entrega;
- dead letters;
- readiness detalhada e heartbeat dos Workers;
- recuperação de leases expirados e retenção de jobs concluídos.

### 4.10 Auditoria — `/admin/auditoria`

- ator, ação, sujeito, motivo e data;
- metadados sensíveis redigidos pela API;
- rastreabilidade das mutações administrativas.

### 4.11 Laboratório e serviço técnico

- `/admin/laboratorio`: sessões de medição, metodologia, executor, status e
  versão;
- `/admin/problemas-tecnicos`: problemas reportados, análise e validação
  técnica.

Essas áreas são principalmente de consulta no estágio atual.

## 5. Worker e automações

O Worker possui scheduler, outbox e executor de jobs duráveis no PostgreSQL.
Entre as funções implementadas estão:

- publicar conteúdo agendado;
- executar alvos de ingestão em `5m`, `15m`, `1h`, `6h` ou `24h`;
- descobrir tópicos e candidatos editoriais;
- gerar auto-drafts;
- coletar e extrair artigos e imagens;
- processar variantes de mídia;
- expirar direitos de mídia;
- descobrir produtos, documentos e mídia de fabricantes;
- coletar preços e marcar listings desatualizados;
- traduzir descrições via API interna e Provider Hub;
- atualizar projeções de busca e tendências de preço;
- rotear eventos de outbox com idempotência;
- recuperar jobs abandonados, aplicar retry e dead letter;
- registrar heartbeat por instância.

A descoberta automática mantém quarentena: produto `UNKNOWN`, listing
`PAUSED`, proposta `PENDING` e direitos de mídia `PENDING`. Publicação,
autoridade canônica e permissão de mídia exigem decisões específicas.

## 6. Autenticação e capacidades

Em staging/produção, configure:

```dotenv
OIDC_ISSUER=https://identity.example.com/
OIDC_AUDIENCE=portal-api
OIDC_JWKS_URI=https://identity.example.com/.well-known/jwks.json
OIDC_ALLOWED_ALGORITHMS=RS256
```

O access token deve possuir ator, `sub`, `exp`, issuer/audience válidos e as
capacidades necessárias. Capacidades usadas atualmente incluem:

- `catalog.read`, `catalog.write`;
- `editorial.read`, `editorial.write`, `editorial.approve`,
  `editorial.publish`;
- `source.read`, `source.write`, `ingestion.read`;
- `claim.read`, `claim.write`, `canonical.propose`, `canonical.decide`;
- `media.read`, `media.review`;
- `commerce.read`, `commerce.manage`;
- `ai.config.read`, `ai.execution.read`;
- `analytics.read`, `operations.read`, `audit.read`;
- `laboratory.read`, `service.read`.

O contrato preciso de cada operação está em `portal.openapi.yaml`.

## 7. Comandos operacionais

### Iniciar tudo em desenvolvimento

```bash
set -a
. ./.env
set +a
npm run dev
```

### Iniciar componentes separadamente

Execute em terminais diferentes, carregando o `.env` em cada um:

```bash
npm run dev -w @portal/api
```

```bash
npm run dev -w @portal/worker
```

```bash
npm run dev -w @portal/web
```

### Consultar saúde

```bash
curl -i http://localhost:3001/health/live
curl -i http://localhost:3001/health/ready
curl -i http://localhost:3000/api/health
```

`live` indica que o processo está respondendo. `ready` também verifica banco,
schema e saúde recente do Worker.

### Parar os runtimes

No terminal que executa `npm run dev`, pressione `Ctrl+C`.

Para parar somente a infraestrutura:

```bash
docker compose -f infra/compose.yml stop
```

Para remover containers e rede preservando os volumes:

```bash
docker compose -f infra/compose.yml down
```

Não use `down -v` neste ambiente sem intenção explícita: ele remove os volumes
do PostgreSQL e MinIO do Portal.

### Ver logs da infraestrutura

```bash
docker compose -f infra/compose.yml logs -f postgres redis minio
```

### Migrations e bootstrap

```bash
npm run db:migrate:verify
npm run db:migrate
npm run bootstrap
```

### Validação completa

```bash
npm run verify:full
```

Esse gate executa:

- verificação da cadeia de migrations;
- fitness functions arquiteturais;
- paridade runtime/OpenAPI;
- scanner de segredos;
- typecheck de API, Web e Worker;
- lint;
- testes unitários e integrações disponíveis;
- builds de produção dos três runtimes.

### Testes E2E públicos

Preparação inicial do navegador:

```bash
npx playwright install chromium
```

Com infraestrutura, migrations e fixtures preparadas:

```bash
npm run test:e2e
```

O Playwright inicia API e Web automaticamente. Para testar serviços já ativos:

```bash
PLAYWRIGHT_MANAGE_SERVERS=false npm run test:e2e
```

Os cenários administrativos privilegiados exigem um token OIDC real:

```bash
PLAYWRIGHT_ADMIN_ACCESS_TOKEN='TOKEN_OIDC' npm run test:e2e
```

Não grave esse token no repositório ou em histórico compartilhado.

### Build de produção

Não carregue `NODE_ENV=development` do `.env` antes do build do Next:

```bash
npm run build
```

Para iniciar artefatos compilados, cada runtime precisa das variáveis próprias:

```bash
npm run start -w @portal/api
npm run start -w @portal/worker
npm run start -w @portal/web
```

Em produção, use um supervisor/orquestrador, `NODE_ENV=production`, OIDC real,
secrets com pelo menos 32 caracteres onde exigido, storage externo e
`OBJECT_STORAGE_AUTO_CREATE_BUCKET=false`. Esses comandos não substituem o
processo de staging/release.

## 8. Configuração de IA

As chaves são runtime-only e nunca podem usar prefixo `NEXT_PUBLIC_`:

```dotenv
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
```

Sem uma chave válida para a rota habilitada, funcionalidades assistidas por IA
falham de forma controlada; catálogo público, edição manual e demais módulos
continuam disponíveis.

O Worker chama a API interna para IA. `INTERNAL_API_KEY` deve ser idêntica na
API e no Worker e diferente dos secrets de sessão/hash.

## 9. Resolução de problemas

### API não inicia

1. confirme que `DATABASE_URL` existe;
2. confirme host, porta `5433` e banco `portal` com o comando sanitizado;
3. execute `docker compose -f infra/compose.yml ps`;
4. execute `npm run db:migrate`;
5. consulte `/health/ready`.

### Admin responde 401

- local: confirme `NODE_ENV=development` e `DEV_ADMIN_TOKEN` igual na API e no
  Web, depois reinicie ambos e abra `/dev-login`;
- staging/produção: confira issuer, audience, JWKS, expiração e capacidades do
  token.

### Imagens não aparecem

- confirme MinIO e o bucket `portal-media`;
- confirme API e Worker ativos;
- confira se variantes foram processadas;
- confira se o ativo e a decisão atual de direitos estão `PERMITTED` e não
  expiraram.

### Jobs não avançam

- confirme o processo Worker;
- consulte `/admin/operacoes` e `/health/ready`;
- confira heartbeat, jobs `DEAD`, `INTERNAL_API_KEY` e acesso ao storage;
- erros transitórios geram retry; mensagens esgotadas permanecem em dead letter.

### Conteúdo descoberto não aparece publicamente

É o comportamento esperado da quarentena. Revise ciclo de vida, proposta
canônica, listing e direitos de mídia antes de promover o conteúdo.

### Porta do PostgreSQL ocupada

Neste computador, não migre para `5432`. Mantenha:

```dotenv
POSTGRES_PORT=5433
DATABASE_URL=postgres://portal:SENHA_DO_PORTAL@localhost:5433/portal
```

## 10. Contratos e documentação complementar

- `portal.openapi.yaml`: contrato das 93 operações HTTP;
- `docs/OIDC_CONFIGURATION.md`: configuração detalhada de autenticação;
- `docs/MEDIA_STORAGE.md`: upload, variantes e entrega privada;
- `docs/SAFE_INGESTION.md`: fronteira SSRF;
- `docs/WORKER_SCHEDULER.md`: jobs automáticos;
- `docs/E2E_TESTING.md`: jornadas Playwright;
- `docs/RELEASE_VERIFICATION.md`: evidências de release;
- `docs/REFACTOR_PROGRESS_2026-08-17.md`: estado da refatoração;
- `docs/AUDITORIA_ARQUITETURAL_2026-08-17.md`: auditoria e riscos.

## 11. Limitações conhecidas

- produção permanece `NO-GO` até existir evidência de staging e decisão formal;
- E2E administrativo completo depende de OIDC real;
- observabilidade externa, alertas e backup/restore ainda precisam de validação
  no ambiente de destino;
- o Web possui tipagem estática dos DTOs, mas validação runtime das respostas
  críticas ainda é um próximo incremento;
- existem nove avisos não bloqueantes de lint no Web, principalmente otimização
  de imagens e parâmetros não utilizados;
- dados descobertos automaticamente permanecem em quarentena por desenho.
