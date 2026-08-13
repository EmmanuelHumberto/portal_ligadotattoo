# Portal Tattoo — AR-20
## Frontend Information Architecture, Design System & Screen Contract Pack

**Versão:** 1.0.0  
**Estado:** BASELINE IMPLEMENTÁVEL  
**Deriva de:** AR-01 a AR-19

## 1. Objetivo

Converter os contratos de produto, backend e API em uma especificação implementável para o portal público e o Admin.

A experiência deve aumentar descoberta, compreensão e permanência sem recorrer a padrões manipulativos. O portal é dark-first, sofisticado, editorial e orientado a cards, com forte legibilidade e navegação entre conteúdo, produtos, conhecimento técnico, preços, notícias, blog e eventos.

## 2. Princípios de experiência

1. Informação técnica densa deve permanecer escaneável.
2. Produto, conteúdo editorial e oferta comercial são visualmente distintos.
3. Canonical Facts têm tratamento visual de informação validada.
4. Claims não aprovados nunca aparecem como fatos públicos.
5. Preço sempre exibe contexto temporal.
6. Imagens de produto usam mídia com direitos permitidos.
7. Cards funcionam como portas de entrada; páginas detalhadas aprofundam.
8. Busca é uma função primária do portal.
9. Desktop e mobile preservam a mesma hierarquia de informação.
10. A interface deve parecer especializada em tatuagem, não um template genérico de marketplace.

## 3. Arquitetura de frontend

Baseline:

```text
apps/web       -> portal público
apps/admin     -> operação/curadoria
packages/ui    -> design system compartilhado
packages/api-client -> gerado a partir do AR-19
packages/config
packages/analytics
```

Framework baseline recomendado:

```text
Next.js + React + TypeScript
```

Renderização pública deve favorecer SSR/SSG/ISR conforme natureza da página. Admin é aplicação autenticada.

## 4. Mapa do portal público

```text
/
├── buscar
├── equipamentos
│   ├── maquinas
│   ├── baterias
│   ├── fontes
│   ├── cartuchos
│   ├── agulhas
│   └── acessorios
├── produto/[slug]
├── noticias
│   └── [slug]
├── blog
│   └── [slug]
├── eventos
│   └── [slug]
├── conhecimento
├── fabricantes
│   └── [slug]
└── sobre/metodologia
```

## 5. Navegação global

Desktop:

```text
Logo
Equipamentos
Notícias
Blog Técnico
Eventos
Busca
```

A busca deve ser visualmente proeminente.

Mobile:

```text
Logo | Busca | Menu
```

Menu abre drawer com categorias e links editoriais.

Header pode se tornar compacto durante scroll, sem esconder acesso à busca.

## 6. Home

Objetivo: condensar o universo relevante da tatuagem e criar múltiplas rotas de exploração.

Ordem baseline:

```text
Hero editorial / assunto principal
Busca universal
Em destaque
Equipamentos em evidência
Movimentação de preços
Últimas notícias
Blog técnico
Próximos eventos
Novidades de fabricantes
Explorar categorias
```

Não transformar a home em feed infinito sem hierarquia.

## 7. Hero

Hero admite:

```text
notícia principal
lançamento relevante
evento importante
artigo técnico especial
```

Composição:

```text
imagem de alto impacto
eyebrow da categoria
headline
resumo curto
CTA
metadados essenciais
```

Em desktop, imagem e texto podem formar composição assimétrica. Em mobile, imagem precede conteúdo.

## 8. Busca universal

Placeholder conceitual:

```text
Busque máquinas, baterias, fontes, fabricantes, notícias...
```

Sugestões agrupadas:

```text
Produtos
Fabricantes
Conteúdo
```

Enter abre `/buscar?q=`.

Resultados devem permitir filtros sem apagar a consulta.

## 9. Página de resultados

Desktop:

```text
query + quantidade
sidebar/filtro ou filter bar
result grid/list
sort
pagination/cursor
```

Mobile:

```text
query
chips ativos
botão Filtrar
result cards
```

Filtros iniciais:

```text
tipo de produto
fabricante
disponibilidade
faixa de preço quando aplicável
```

## 10. Product Card

Conteúdo:

```text
imagem
fabricante
modelo
tipo
2–4 especificações canônicas relevantes
preço atual “a partir de” quando disponível
indicador de variação de preço quando confiável
quantidade de ofertas quando útil
```

Não colocar especificações provenientes apenas de listing como se fossem canônicas.

Estados:

```text
default
hover/focus
sem imagem
sem preço
produto descontinuado
```

## 11. Página de produto

Estrutura:

```text
breadcrumb
gallery
manufacturer + model + lifecycle
resumo
canonical specifications
ofertas
histórico de preços
conteúdo relacionado
problemas técnicos públicos/validados
produtos relacionados
fontes/metodologia quando aplicável
```

Desktop usa duas colunas no topo:

```text
gallery | identidade + especificações-chave + preço
```

Mobile empilha.

## 12. Ficha técnica

Canonical Facts usam componente `SpecificationTable`.

Cada item:

```text
label
valor
unidade
contexto opcional
```

Quando uma informação não é validada:

```text
não inventar valor
não preencher com claim não aprovado
mostrar “Não confirmado” somente se editorialmente útil
```

## 13. Ofertas

Offer Card:

```text
vendedor
preço
moeda
disponibilidade
data da última observação
CTA externo
```

Aviso de temporalidade:

```text
Preço observado em DD/MM/AAAA HH:mm
```

O portal não promete preço atual se a observação estiver defasada.

## 14. Histórico de preços

Visual:

```text
gráfico temporal
preço atual observado
mínimo/máximo da janela
variação percentual quando calculável
seletor 30d / 90d / 180d / 1a / tudo
```

Sem dados suficientes:

```text
“Histórico insuficiente para calcular tendência.”
```

## 15. Notícias

Index:

```text
lead story
grid de notícias
filtros/tópicos
paginação
```

Article:

```text
categoria
headline
dek
autor/editor
publicação/atualização
hero media
corpo
fontes/referências
produtos relacionados
conteúdo relacionado
```

## 16. Blog técnico

Index deve ter identidade própria, mas usar o mesmo design system.

Categorias possíveis:

```text
Manutenção
Diagnóstico
Equipamentos
Boas práticas
Curiosidades técnicas
Comunicados
Guias
```

Artigo técnico pode incluir:

```text
callouts
passos
tabelas
fotos
diagramas
produtos relacionados
technical issues relacionados
links para especificações canônicas
```

Blog é editorial; não altera automaticamente Knowledge.

## 17. Eventos

Card:

```text
nome
data
cidade/país
imagem
status
```

Página:

```text
datas
local
descrição
site oficial
status: programado/adiado/cancelado/concluído
conteúdo relacionado
```

Cancelamento/adiamento precisa de destaque visual inequívoco.

## 18. Fabricante

Página:

```text
identidade
site oficial
país
produtos
lançamentos/notícias
conteúdo técnico relacionado
```

Não misturar fabricante e seller.

## 19. Knowledge surfaces públicas

O portal não precisa expor o modelo interno de Knowledge ao usuário comum.

Pode mostrar:

```text
“Especificação verificada”
“Fonte técnica”
“Última revisão”
```

A proveniência detalhada pode aparecer em drawer/modal “Como sabemos isso?”.

## 20. Dark visual system

A interface é dark-first.

Tokens conceituais:

```text
surface.canvas        #0B0C0F
surface.base          #111318
surface.raised        #171A20
surface.overlay       #20242C
border.subtle         rgba(255,255,255,.08)
text.primary          #F4F5F7
text.secondary        #A8AFBA
text.muted            #747D89
accent.primary        #C7FF4A
accent.secondary      #7B61FF
status.positive       #62D995
status.warning        #F4C95D
status.negative       #FF6B6B
```

Valores finais devem ser validados por contraste WCAG antes de congelar implementação.

## 21. Direção estética

Características:

```text
alto contraste
superfícies escuras em camadas
tipografia editorial forte
cards com borda sutil
imagens grandes e limpas
espaçamento generoso
dados técnicos alinhados
microinterações discretas
```

Evitar:

```text
neon excessivo
glow em todos os elementos
gradientes decorativos gratuitos
glassmorphism que reduza legibilidade
densidade de marketplace genérico
```

## 22. Tipografia

Famílias devem ser web-safe/licenciadas e carregadas com estratégia de performance.

Escala conceitual:

```text
Display XL  56/60
Display L   44/50
H1          36/42
H2          28/34
H3          22/28
Body L      18/28
Body        16/24
Small       14/20
Micro       12/16
```

Mobile reduz displays, não o body abaixo de legibilidade adequada.

## 23. Grid

Desktop:

```text
max content width ~1440px
12 colunas
gutter 24–32px
page margin responsiva
```

Tablet:

```text
8 colunas
```

Mobile:

```text
4 colunas
16px page margin baseline
```

## 24. Spacing

Escala base:

```text
4, 8, 12, 16, 24, 32, 48, 64, 96
```

## 25. Radius

```text
control: 8–10
card: 12–16
media: coerente com card
pill: full
```

Não usar radius excessivamente “fofo” para uma identidade técnica.

## 26. Componentes base

```text
Button
IconButton
Link
Input
SearchInput
Select
Combobox
Checkbox
Radio
Switch
Tabs
Chip
Badge
Tooltip
Popover
Drawer
Modal
Toast
Skeleton
EmptyState
ErrorState
Pagination
Breadcrumb
```

## 27. Componentes de domínio

```text
ProductCard
OfferCard
PriceTrend
PriceHistoryChart
SpecificationTable
CanonicalBadge
ManufacturerMark
EditorialCard
TechnicalArticleCard
EventCard
SourceAttribution
MediaGallery
RelatedContentRail
TechnicalIssueCard
SearchSuggestionGroup
FilterPanel
```

## 28. Card system

Cards devem compartilhar anatomia, mas não parecer idênticos.

Tipos:

```text
Product
Editorial
Technical
Event
Offer
Metric
```

Card deve ter uma ação principal clara. Evitar múltiplos CTAs concorrentes.

## 29. Imagens

Product media:

```text
object contain quando o equipamento precisa aparecer inteiro
fundo neutro
fallback visual consistente
```

Editorial:

```text
crop controlado
aspect ratios padronizados
caption/attribution quando necessário
```

Lazy loading abaixo da dobra.

## 30. Motion

Permitido:

```text
hover elevation sutil
image scale mínimo
drawer/modal transitions
skeleton
chart transitions discretas
```

Respeitar `prefers-reduced-motion`.

## 31. Acessibilidade

Baseline:

```text
WCAG 2.2 AA
navegação por teclado
focus visível
labels reais
landmarks
alt text
contraste validado
target touch adequado
não depender apenas de cor
reduced motion
```

## 32. Estados obrigatórios

Toda tela de dados implementa:

```text
loading
success
empty
partial
error
stale quando relevante
```

## 33. SEO

Páginas indexáveis:

```text
home
produto
fabricante
notícia
blog
evento
categorias
```

Implementar:

```text
canonical URL
metadata
Open Graph
Twitter cards
sitemap
robots
structured data quando semanticamente válido
```

## 34. Structured data

Candidatos:

```text
Product
Article / NewsArticle
BlogPosting
Event
BreadcrumbList
Organization
```

Offer/price só deve ser publicado em structured data se atender critérios de atualidade e semântica.

## 35. Performance

Metas de implementação:

```text
LCP <= 2.5s p75
INP <= 200ms p75
CLS <= 0.1 p75
```

Estratégias:

```text
image optimization
route-level code splitting
font optimization
server rendering
cache
prefetch seletivo
skeleton sem layout shift
```

## 36. Analytics

Eventos mínimos:

```text
search_submitted
search_result_clicked
product_viewed
offer_clicked
price_history_changed
editorial_opened
related_content_clicked
filter_applied
event_opened
```

Não registrar texto sensível arbitrário.

## 37. Métricas de permanência úteis

Medir:

```text
engaged time
scroll depth por tipo de conteúdo
navegação para conteúdo relacionado
retorno à busca
produto -> oferta
artigo -> produto
produto -> artigo técnico
```

Não usar dark patterns para inflar sessão.

# ADMIN

## 38. Mapa Admin

```text
/admin
├── dashboard
├── produtos
├── knowledge
│   ├── claims
│   ├── propostas
│   └── conflitos
├── midia
├── fontes
├── ingestao
├── comercio
├── editorial
├── problemas-tecnicos
├── laboratorio
├── ia
│   ├── provedores
│   ├── modelos
│   ├── workloads
│   ├── roteamento
│   └── execucoes
├── operacoes
└── auditoria
```

## 39. Admin shell

Desktop:

```text
sidebar persistente
topbar
workspace
contextual actions
```

Mobile/tablet:

```text
collapsible navigation
```

Admin privilegia densidade e eficiência sobre impacto editorial.

## 40. Dashboard

Cards:

```text
itens aguardando curadoria
propostas canônicas pendentes
ingestões com falha
conteúdo aguardando revisão
problemas técnicos em análise
fontes degradadas
AI executions com falha
```

## 41. Admin Product

Tabs:

```text
Identidade
Ficha canônica
Claims
Mídia
Ofertas
Conteúdo
Problemas técnicos
Histórico/Audit
```

Alterações versionadas devem lidar com `409 CONCURRENT_MODIFICATION`.

## 42. Curadoria de Claim

Workspace:

```text
claim/value
origem
snapshot/evidence
produto
canonical fact atual
claims conflitantes
ações
```

Ações:

```text
suportar/rejeitar/disputar
criar proposta canônica
```

## 43. Decisão canônica

Tela crítica deve exibir lado a lado:

```text
valor atual
valor proposto
evidências
claims
origem
razão obrigatória
```

Botões:

```text
Aprovar
Rejeitar
```

Não oferecer “aprovar tudo” em massa no baseline.

## 44. Editorial Admin

Workflow visual:

```text
Draft -> Review -> Approved -> Scheduled/Published
```

Editor:

```text
title
subtitle
summary
body blocks
media
sources
related products
preview
AI assistance
```

Conteúdo produzido por IA deve ser identificável no workflow interno.

## 45. AI Provider Hub Admin

Tela Providers:

```text
provider
enabled
health
secret configured
models
last health check
```

Tela Routing:

```text
workload
primary provider/model
fallback order
budget
retry
timeout
```

Tela Executions:

```text
workload
provider/model
status
latency
usage
cost
fallback count
correlation
```

Nunca mostrar API key completa.

## 46. Ingestion Admin

```text
sources
targets
acquisition runs
snapshots
extraction runs
resolution candidates
failures
```

Snapshot viewer deve deixar claro que o conteúdo é evidência capturada.

## 47. Commerce Admin

```text
sellers
marketplaces
listings
product resolution
price observations
staleness
```

## 48. Responsive breakpoints

Baseline conceitual:

```text
sm  640
md  768
lg  1024
xl  1280
2xl 1536
```

Implementação não deve depender de device names.

## 49. URL state

Filtros, query e sort importantes devem ser serializados na URL para:

```text
deep link
back/forward
share
analytics
SSR
```

## 50. Data fetching

Public:

```text
server fetch por padrão
client fetch para interações incrementais
```

Admin:

```text
query cache
invalidations explícitas após commands
optimistic UI apenas onde reversão é segura
```

Decisão canônica não usa optimistic UI.

## 51. Error UX

Mapeamentos:

```text
404 -> not found contextual
409 -> refresh/reload comparison
422 -> field errors
429 -> retry guidance
5xx -> recoverable generic state + correlation ID
```

Admin mostra correlation ID para suporte.

## 52. Segurança frontend

```text
nenhum provider secret no bundle
nenhuma API key pública de IA
sanitização de conteúdo editorial
CSP
noopener/noreferrer em links externos
proteção contra open redirect
OIDC session handling seguro
```

## 53. Screen Contract — Home

APIs:

```text
GET /public/editorial
GET /public/products
```

Estados:

```text
loading sections independently
partial content allowed
critical hero fallback
```

## 54. Screen Contract — Product

APIs:

```text
GET /public/products/{slug}
GET /public/products/{slug}/offers
GET /public/products/{slug}/price-history
```

Ofertas/histórico podem carregar independentemente da ficha.

## 55. Screen Contract — Search

APIs:

```text
GET /public/search
GET /public/search/suggest
```

Suggestion request é debounced e cancelável.

## 56. Screen Contract — Editorial

APIs:

```text
GET /public/editorial
GET /public/editorial/{slug}
```

Frontend distingue tipo editorial para template e structured data.

## 57. Screen Contract — Admin Knowledge

APIs:

```text
POST /admin/claims
POST /admin/canonical-proposals
POST /admin/canonical-proposals/{id}/decision
```

AR-19 deverá ser expandido com GETs administrativos de fila/detalhe conforme a implementação da tela. Esta é uma lacuna identificada, não deve ser simulada no frontend.

## 58. Lacunas de API identificadas

Para o Admin completo serão necessários contratos adicionais, compatíveis com AR-19:

```text
GET /admin/claims
GET /admin/claims/{id}
GET /admin/canonical-proposals
GET /admin/canonical-proposals/{id}
GET /admin/media
GET /admin/sources
GET /admin/ingestion/runs
GET /admin/editorial
GET /admin/editorial/{id}
GET /admin/listings
GET /admin/ai/executions
GET /admin/audit
```

Esses endpoints devem entrar em uma revisão aditiva do OpenAPI antes da implementação integral do Admin.

## 59. Design tokens package

Estrutura:

```text
packages/ui/src/tokens/
  color.ts
  typography.ts
  spacing.ts
  radius.ts
  shadow.ts
  motion.ts
  breakpoint.ts
  zIndex.ts
```

CSS variables são exportadas para Web/Admin.

## 60. Component package

```text
packages/ui/src/components/base/
packages/ui/src/components/domain/
packages/ui/src/components/editorial/
packages/ui/src/components/data-display/
packages/ui/src/components/feedback/
```

## 61. Storybook

Cada componente compartilhado deve possuir histórias para:

```text
default
variants
loading
empty quando aplicável
error quando aplicável
long content
mobile width
keyboard/focus
```

## 62. Testes frontend

```text
unit: formatters/state
component: interaction/accessibility
visual regression: cards/screens críticas
E2E: principais jornadas
```

## 63. E2E público

Jornadas:

```text
buscar produto -> abrir produto -> ver preço -> abrir oferta
home -> notícia -> produto relacionado
blog -> artigo técnico -> ficha do equipamento
produto -> histórico de preços -> mudar janela
eventos -> abrir evento
```

## 64. E2E Admin

```text
login -> criar produto
claim -> proposta -> decisão canônica
draft editorial -> review -> publish
source -> ingestion run -> resolution
AI provider -> routing policy
```

## 65. Definition of Done — screen

Uma tela está pronta quando:

```text
route
API contract
loading
empty
error
responsive
keyboard
analytics
SEO se pública
performance budget
tests
```

## 66. Decisões congeladas

1. Portal público dark-first.
2. Interface sofisticada, editorial e técnica.
3. Cards são padrão principal de descoberta.
4. Busca universal é primária.
5. Home não é feed indiferenciado.
6. Product Page integra ficha, mídia, ofertas, preço e conhecimento relacionado.
7. Canonical Facts têm prioridade visual.
8. Claims não aprovados não aparecem como especificação pública.
9. Preços exibem data de observação.
10. Histórico de preços informa insuficiência de dados.
11. Blog técnico é área editorial própria.
12. Notícias, blog e eventos compartilham infraestrutura, com templates distintos.
13. Imagens públicas respeitam direitos.
14. Admin é mais denso que o portal público.
15. Decisão canônica exige comparação e razão.
16. IA é assistente visível no workflow Admin, não autoridade silenciosa.
17. AI Provider Hub possui telas próprias.
18. Nenhum secret é exposto ao frontend.
19. WCAG 2.2 AA é baseline.
20. Core Web Vitals possuem metas explícitas.
21. Estado de busca/filtros relevante permanece na URL.
22. Design system é compartilhado via `packages/ui`.
23. API client é gerado do OpenAPI.
24. Storybook é obrigatório para componentes compartilhados.
25. Lacunas administrativas de GET identificadas devem ser adicionadas ao AR-19 antes do Admin integral.

## 67. Próximo artefato

**AR-21 — Frontend Route & Component Implementation Blueprint**

Deverá transformar este contrato visual em estrutura de código:

```text
Next.js routes
layouts
server/client component boundaries
data fetching
typed API client usage
component tree por tela
design token implementation
SEO metadata generators
analytics hooks
error/loading boundaries
Storybook inventory
test inventory
```
