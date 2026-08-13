# Portal Tattoo — AR-21
## Frontend Route & Component Implementation Blueprint

**Versão:** 1.0.0  
**Estado:** BASELINE IMPLEMENTÁVEL  
**Deriva de:** AR-01 a AR-20

## 1. Objetivo

Converter o AR-20 em uma estrutura concreta de implementação para `apps/web`, `apps/admin` e `packages/ui`.

Stack baseline:

```text
Next.js App Router
React
TypeScript strict
CSS variables + CSS Modules ou Tailwind sobre tokens compartilhados
OpenAPI generated client
Storybook
Vitest
Testing Library
Playwright
```

A implementação não deve duplicar contratos da API manualmente.

## 2. Monorepo frontend

```text
apps/
  web/
  admin/

packages/
  ui/
  api-client/
  analytics/
  config/
  testing/
```

## 3. apps/web

```text
apps/web/
  src/
    app/
      (site)/
        layout.tsx
        page.tsx
        loading.tsx
        error.tsx
        buscar/
        equipamentos/
        produto/[slug]/
        noticias/
        blog/
        eventos/
        conhecimento/
        fabricantes/[slug]/
        sobre/metodologia/
      api/
      robots.ts
      sitemap.ts
      not-found.tsx
    components/
      home/
      search/
      product/
      editorial/
      commerce/
    lib/
      api/
      seo/
      cache/
      format/
      analytics/
    styles/
      globals.css
```

## 4. apps/admin

```text
apps/admin/
  src/
    app/
      (auth)/
      (workspace)/
        layout.tsx
        dashboard/
        produtos/
        knowledge/
        midia/
        fontes/
        ingestao/
        comercio/
        editorial/
        problemas-tecnicos/
        laboratorio/
        ia/
        operacoes/
        auditoria/
    components/
      shell/
      tables/
      forms/
      knowledge/
      editorial/
      ingestion/
      ai/
    lib/
      auth/
      api/
      permissions/
      mutations/
      queries/
```

## 5. packages/ui

```text
packages/ui/
  src/
    tokens/
    primitives/
    components/
      base/
      navigation/
      data-display/
      feedback/
      editorial/
      commerce/
      knowledge/
    styles/
    index.ts
```

Nenhum componente compartilhado deve importar diretamente código de `apps/web` ou `apps/admin`.

## 6. packages/api-client

Gerado do AR-19 OpenAPI.

```text
packages/api-client/
  generated/
  runtime/
  index.ts
```

Regra:

```text
generated/* = não editar manualmente
```

Wrappers podem existir em `runtime/`.

## 7. Root layout público

Responsabilidades:

```text
HTML metadata defaults
font loading
global CSS
theme variables
analytics provider
site header
main landmark
footer
```

Preferir Server Component.

## 8. SiteHeader

Server shell + client islands somente para:

```text
mobile menu
search interaction
scroll compact state se realmente necessário
```

Não transformar header inteiro em Client Component.

## 9. Home component tree

```text
HomePage [Server]
├── SiteHero [Server]
├── UniversalSearch [Client island]
├── FeaturedRail [Server]
├── EquipmentGrid [Server]
│   └── ProductCard
├── PriceMovementSection [Server]
│   └── PriceTrendCard
├── LatestNews [Server]
│   └── EditorialCard
├── TechnicalBlogSection [Server]
│   └── TechnicalArticleCard
├── UpcomingEvents [Server]
│   └── EventCard
└── CategoryExplorer [Server]
```

Sections podem falhar independentemente quando não críticas.

## 10. Home data strategy

Server fetch paralelo:

```ts
Promise.allSettled([
  getFeaturedEditorial(),
  getFeaturedProducts(),
  getPriceMovements(),
  getLatestNews(),
  getTechnicalArticles(),
  getUpcomingEvents(),
])
```

Falha em seção secundária não derruba a Home inteira.

## 11. Product route

```text
/produto/[slug]
```

Component tree:

```text
ProductPage [Server]
├── Breadcrumb
├── ProductHero
│   ├── MediaGallery [Client only where interaction needed]
│   └── ProductIdentity
├── SpecificationSection
│   └── SpecificationTable
├── OffersSection
│   └── OfferCard[]
├── PriceHistorySection
│   └── PriceHistoryChart [Client]
├── TechnicalIssuesSection
├── RelatedEditorialRail
└── RelatedProductsRail
```

## 12. Product data loading

Critical:

```text
GET /public/products/{slug}
```

Noncritical/deferred:

```text
GET /public/products/{slug}/offers
GET /public/products/{slug}/price-history
```

Pode usar Suspense boundaries separadas.

## 13. Product metadata

`generateMetadata` usa dados do produto.

Gerar:

```text
title
description
canonical
OpenGraph
image se permitida
```

Structured data é gerado apenas com campos semanticamente válidos.

## 14. Search route

```text
/buscar?q=&productType=&manufacturer=&cursor=
```

`searchParams` é fonte de verdade para filtros compartilháveis.

Component tree:

```text
SearchPage [Server]
├── SearchHeader
│   └── SearchBox [Client]
├── ActiveFilters [Client]
├── FilterPanel [Client]
└── SearchResults [Server]
    └── ResultCard[]
```

## 15. Search suggestions

`SearchBox`:

```text
debounce
AbortController
keyboard navigation
aria-activedescendant ou combobox semantics
escape closes
enter submits
```

Não armazenar sugestões como estado global.

## 16. Equipment listing

Route family:

```text
/equipamentos
/equipamentos/maquinas
/equipamentos/baterias
/equipamentos/fontes
/equipamentos/cartuchos
/equipamentos/agulhas
/equipamentos/acessorios
```

Pode reutilizar `ProductListingPage`.

## 17. Editorial route architecture

```text
/noticias
/noticias/[slug]
/blog
/blog/[slug]
/eventos
/eventos/[slug]
```

Shared:

```text
EditorialIndexShell
EditorialArticleShell
RelatedContentRail
SourceAttribution
```

Specific:

```text
NewsHero
TechnicalArticleBody
EventFacts
```

## 18. Rich editorial rendering

`body_document` deve ser renderizado por renderer de blocos permitido.

Nunca:

```text
dangerouslySetInnerHTML com HTML arbitrário
```

Renderer aceita apenas block types registrados.

## 19. Editorial block registry

Baseline:

```text
paragraph
heading
image
quote
callout
table
steps
productReference
technicalIssueReference
sourceList
```

Unknown block:

```text
log telemetry
skip safely
```

## 20. PriceHistoryChart

Client Component por interação.

Input já normalizado:

```ts
type PricePoint = {
  observedAt: string;
  amount: number;
}
```

Responsabilidades:

```text
render
tooltip
accessible summary
window interaction
```

Não calcula regras comerciais críticas que pertencem ao backend.

## 21. ProductCard contract

Props:

```ts
type ProductCardProps = {
  href: string;
  image?: PublicMedia;
  manufacturer: string;
  name: string;
  productType: string;
  specifications: Array<{ label: string; value: string }>;
  offer?: {
    amount: number;
    currency: string;
    observedAt: string;
  };
  priceChangePercent?: number | null;
  lifecycle?: string;
};
```

## 22. OfferCard contract

```ts
type OfferCardProps = {
  seller: string;
  amount: number;
  currency: string;
  url: string;
  availability?: string | null;
  observedAt: string;
};
```

External CTA:

```text
target optional
rel=noopener noreferrer
analytics offer_clicked
```

## 23. EditorialCard

Variantes:

```text
lead
standard
compact
horizontal
```

Props não devem conter lógica de fetch.

## 24. EventCard

Estados:

```text
scheduled
postponed
cancelled
completed
```

Status não depende somente de cor.

## 25. UI primitives

Primitives devem ser acessíveis por padrão:

```text
Button
IconButton
TextField
SearchField
Select
Combobox
Checkbox
RadioGroup
Switch
Tabs
Dialog
Drawer
Popover
Tooltip
```

Preferir biblioteca headless madura quando isso reduzir risco de acessibilidade, encapsulada por `packages/ui`.

## 26. Tokens runtime

Gerar CSS variables:

```css
:root {
  --surface-canvas: #0B0C0F;
  --surface-base: #111318;
  --surface-raised: #171A20;
  --text-primary: #F4F5F7;
  --text-secondary: #A8AFBA;
  --accent-primary: #C7FF4A;
}
```

Tokens TypeScript e CSS devem vir de uma fonte única ou geração determinística.

## 27. Theme

Baseline público:

```text
dark
```

Não implementar alternância light/dark antes de existir requisito explícito.

Admin também usa dark baseline, podendo ter densidade distinta.

## 28. Image component

Wrapper `PortalImage`:

```text
Next/Image
approved domains/config
aspect ratio
fallback
alt requirements
loading strategy
```

Hero acima da dobra pode usar priority seletivamente.

## 29. Data access — Web

Criar server API facade:

```text
src/lib/api/public.ts
```

Exemplo:

```ts
export async function getPublicProduct(slug: string) {
  return publicApi.getPublicProduct({ slug });
}
```

Facade centraliza:

```text
base URL
headers
correlation
cache policy
error mapping
```

## 30. Cache matrix

Baseline:

```text
product identity/specifications -> revalidate/tag
editorial published -> revalidate/tag
search -> dynamic/no shared stale cache where query-specific
offers -> short TTL
price history -> short/moderate TTL
events -> moderate TTL with invalidation
```

Valores numéricos finais são configuração operacional, não hardcode espalhado.

## 31. Cache tags

Exemplos:

```text
product:{id}
product-slug:{slug}
editorial:{id}
editorial-feed:{type}
offers:{productId}
price-history:{productId}
```

Backend publication/update workflows podem acionar revalidation por endpoint interno autenticado.

## 32. Error model

API facade converte Problem Details para:

```ts
type AppApiError = {
  status: number;
  code: string;
  correlationId?: string;
  detail?: string;
  fieldErrors?: Array<...>;
}
```

## 33. Web error boundaries

```text
app/error.tsx
route error.tsx quando necessário
not-found.tsx
component-level recoverable states
```

Nunca exibir stack trace.

## 34. Admin auth

Admin layout resolve sessão no servidor.

Sem sessão:

```text
redirect para login
```

Capabilities são disponibilizadas por contexto seguro.

Frontend capability check melhora UX, mas backend continua autoridade final.

## 35. Admin navigation

Itens são filtrados por capability.

Exemplo:

```text
AI Hub -> ai.configure
Knowledge decision -> canonical.decide
Editorial publish -> editorial.publish
```

Não usar ocultação de menu como mecanismo de segurança.

## 36. Admin query layer

Biblioteca client query pode ser usada para:

```text
tables
filters
pagination
refetch
mutations
```

Cada query key deve ser centralizada.

## 37. Admin mutation pattern

```text
form
-> validate local schema
-> API command
-> success
-> invalidate relevant queries
-> toast
```

409:

```text
não sobrescrever
mostrar conflito
oferecer reload/compare
```

## 38. Canonical decision screen

Component tree:

```text
CanonicalDecisionPage
├── ProposalHeader
├── CurrentVsProposed
├── EvidencePanel
├── ClaimsPanel
├── SourceSnapshotPanel
├── DecisionReasonField
└── DecisionActions
```

`DecisionActions` exige confirmação explícita.

Não implementar bulk approval.

## 39. Editorial editor

Estrutura:

```text
EditorialEditor
├── MetadataFields
├── BlockEditor
├── MediaPicker
├── SourceManager
├── ProductRelations
├── AIAssistPanel
└── PreviewPanel
```

Autosave pode existir para draft, com version handling.

## 40. AI Assist Panel

Ações podem incluir:

```text
sugerir título
resumir fontes
gerar rascunho
extrair evento
classificar conteúdo
```

Resultado da IA entra como sugestão/editável.

UI deve mostrar:

```text
provider/model opcionalmente em detalhe operacional
timestamp
status
```

Não precisa poluir a experiência editorial com detalhes técnicos por padrão.

## 41. AI Provider Hub — Providers

Route:

```text
/admin/ia/provedores
```

Component tree:

```text
AIProvidersPage
├── ProviderStatusGrid
│   └── AIProviderCard
└── ProviderConfigDrawer
```

Card:

```text
displayName
enabled
health
secretConfigured
models count
```

Secret input é write-only quando endpoint correspondente for adicionado.

## 42. AI Routing

Route:

```text
/admin/ia/roteamento
```

```text
RoutingPolicyTable
RoutingPolicyEditor
CandidateOrderList
BudgetPolicyFields
RetryPolicyFields
```

Drag/drop não é obrigatório; controles acessíveis de reorder são necessários.

## 43. Ingestion workspace

```text
SourceList
TargetTable
AcquisitionRunTable
SnapshotViewer
ExtractionRunPanel
ResolutionQueue
```

Snapshot viewer não executa scripts do conteúdo capturado.

## 44. Tables

Admin table primitive suporta:

```text
server pagination
sort
filters
row selection quando permitido
empty
loading
error
```

Não habilitar seleção em massa em operações críticas sem requisito.

## 45. Forms

Stack conceitual:

```text
React Hook Form ou equivalente
schema validation compartilhável
server Problem Details mapping
```

Backend continua validação definitiva.

## 46. URL state Admin

Listagens persistem em URL:

```text
page/cursor
filters
sort
selected status
```

## 47. Analytics package

API:

```ts
track(event, properties)
identify(...)
page(...)
```

Apps importam contrato, não SDK de fornecedor diretamente.

Isso mantém analytics substituível.

## 48. Public analytics hooks

```text
useSearchAnalytics
useProductAnalytics
useOfferAnalytics
useEditorialAnalytics
```

Server-rendered page views podem ser instrumentadas sem forçar página inteira para client.

## 49. Consent

Analytics que dependam de consentimento devem respeitar a política legal/configuração de deployment.

Não assumir consentimento implícito no código base.

## 50. SEO package

Helpers:

```text
buildProductMetadata
buildEditorialMetadata
buildEventMetadata
buildManufacturerMetadata
buildCanonicalUrl
buildStructuredData
```

Structured data tem schemas tipados.

## 51. Sitemap

Segmentar se volume exigir:

```text
products
editorial
events
manufacturers
```

Nunca incluir Admin.

## 52. Robots

Admin e endpoints internos não são indexáveis.

## 53. Storybook inventory — base

```text
Button
IconButton
TextField
SearchField
Select
Combobox
Tabs
Dialog
Drawer
Tooltip
Badge
Chip
Skeleton
EmptyState
ErrorState
```

## 54. Storybook inventory — domain

```text
ProductCard
OfferCard
PriceTrend
SpecificationTable
CanonicalBadge
EditorialCard
TechnicalArticleCard
EventCard
SourceAttribution
TechnicalIssueCard
MediaGallery
FilterPanel
```

## 55. Visual regression

Snapshots obrigatórios para:

```text
Home desktop/mobile
Product desktop/mobile
Search desktop/mobile
Article desktop/mobile
Admin dashboard
Canonical decision
Editorial editor
AI routing
```

## 56. Unit tests

Prioridade:

```text
currency/date formatters
price presentation
URL filter serialization
Problem Details mapping
metadata builders
structured data builders
capability helpers
```

## 57. Component tests

Prioridade:

```text
SearchBox keyboard
FilterPanel
PriceHistoryChart accessible summary
MediaGallery
CanonicalDecision form
Editorial block renderer
AI routing reorder
```

## 58. E2E — Public

Playwright:

```text
home -> product
search -> filters -> product
product -> offers
product -> price window
news -> related product
blog -> product reference
event -> official URL
```

## 59. E2E — Admin

```text
auth guard
create manufacturer/product
claim -> proposal -> approve
concurrency conflict
editorial draft -> publish
source -> acquisition
AI routing edit
```

## 60. Mock strategy

Mocks gerados/derivados dos schemas OpenAPI.

Não manter DTO fake divergente manualmente.

Fixtures de domínio ficam em `packages/testing`.

## 61. Accessibility automation

CI:

```text
eslint jsx a11y
component axe
Playwright axe em jornadas principais
keyboard smoke tests
```

Automação complementa revisão manual.

## 62. Performance budget

CI/build observa:

```text
route JS
image sizes
font payload
Core Web Vitals em ambiente monitorado
```

Client Components precisam de justificativa funcional.

## 63. Bundle boundaries

Não importar no client:

```text
server secrets
Node-only SDK
admin-only code
AI provider SDK
database code
```

## 64. Environment variables

Public client variables usam prefixo explícito apenas quando realmente públicas.

Exemplos server-only:

```text
API_INTERNAL_BASE_URL
OIDC_SECRET
REVALIDATION_SECRET
```

Nenhuma chave de OpenAI/Anthropic/DeepSeek pertence a Web/Admin.

## 65. CSP

Planejar nonce/hash strategy para Next.js deployment.

Restringir:

```text
script-src
connect-src
img-src
frame-src
```

Domains de mídia são configurados.

## 66. External links

Offer/vendor/event external links passam por componente seguro:

```text
ExternalLink
```

Pode instrumentar analytics e aplicar rel seguro.

## 67. Loading architecture

Route `loading.tsx` para skeleton estrutural.

Suspense local para:

```text
offers
price history
related content
```

Skeleton preserva dimensões para evitar CLS.

## 68. Empty states

Exemplos:

```text
sem ofertas -> “Nenhuma oferta observada no momento.”
sem histórico -> “Ainda não há histórico suficiente.”
sem resultados -> sugestões de ajuste da busca
sem eventos -> não inventar eventos
```

## 69. Stale states

Oferta antiga deve indicar data.

Admin pode mostrar badge:

```text
STALE
```

com threshold configurável.

## 70. Internationalization readiness

Baseline pode iniciar em `pt-BR`, mas:

```text
strings de UI centralizadas
Intl para moeda/data
URLs preparadas para estratégia futura
conteúdo editorial mantém locale
```

Não espalhar texto estrutural dentro de componentes genéricos.

## 71. Currency

Usar:

```text
Intl.NumberFormat
```

Nunca concatenar símbolo manualmente.

## 72. Date/time

Usar timezone explícito para eventos e observações.

Evitar ambiguidade de data no Admin.

## 73. Frontend logging

Erros client relevantes:

```text
route
operation
correlationId
browser context técnico
```

Não registrar tokens, secrets ou corpo editorial sensível desnecessariamente.

## 74. Feature flags

Port simples:

```ts
interface FeatureFlags {
  isEnabled(key: string): boolean;
}
```

Usos possíveis:

```text
AI assist experimental
new search experience
autopublish future mode
```

Flag não substitui authorization.

## 75. Build order

```text
F01 monorepo frontend skeleton
F02 tokens + primitives
F03 generated API client
F04 public shell/header/footer
F05 ProductCard + editorial cards
F06 Home
F07 Product detail
F08 Search/listings
F09 News/Blog/Event
F10 SEO/structured data/sitemap
F11 Admin shell/auth/capabilities
F12 Catalog Admin
F13 Knowledge curation
F14 Editorial Admin
F15 Sources/Ingestion Admin
F16 Commerce Admin
F17 AI Hub Admin
F18 visual/a11y/performance hardening
```

## 76. First executable frontend slice

Entrega:

```text
dark design tokens
SiteHeader/Footer
Home
ProductCard
Product page
Search
API client integration
loading/error states
responsive layout
Storybook base
Playwright smoke
```

Dados vêm da API real ou contract mock gerado.

## 77. Second executable frontend slice

```text
News
Blog técnico
Events
Editorial article renderer
Related content
SEO structured data
```

## 78. Third executable frontend slice

```text
Admin shell
Catalog
Knowledge curation
Canonical decision
Editorial workflow
```

## 79. Fourth executable frontend slice

```text
Sources/Ingestion
Commerce
Technical service
Laboratory
AI Provider Hub
Operations/Audit
```

## 80. API gap gate

Antes de F13–F17, incorporar ao OpenAPI os GETs administrativos registrados no AR-20.

Frontend não deve criar endpoints ad hoc.

## 81. Definition of Done — component

```text
typed props
accessible semantics
responsive behavior
loading/disabled when relevant
Storybook
component test
no app-specific hidden dependency
```

## 82. Definition of Done — route

```text
route implemented
metadata
API integration
loading
empty
error
responsive
analytics
accessibility
tests
cache policy
```

## 83. Pull request gates

```text
typecheck
lint
unit
component
OpenAPI client generation consistency
Storybook build
Playwright smoke
a11y
bundle checks
```

## 84. Decisões congeladas

1. Next.js App Router é o baseline do portal.
2. Web e Admin são apps separados no monorepo.
3. Design system vive em `packages/ui`.
4. API client é gerado do OpenAPI.
5. Server Components são padrão no Web.
6. Client Components são usados somente onde há interação real.
7. Busca e filtros compartilháveis usam URL state.
8. Product Page separa dados críticos e secundários com boundaries.
9. Conteúdo editorial usa block renderer seguro.
10. Price chart não implementa regra comercial canônica no client.
11. Admin usa auth server-side e capability-aware UI.
12. Backend permanece autoridade de autorização.
13. Canonical decision não usa optimistic UI.
14. AI assistance produz sugestões editáveis.
15. Provider secrets nunca entram no bundle.
16. Analytics é abstraído por package.
17. SEO é implementado por helpers tipados.
18. Storybook e visual regression fazem parte da implementação.
19. WCAG automation entra no CI.
20. Client JS possui budget.
21. `pt-BR` é baseline com readiness para i18n.
22. Datas e moedas usam Intl/timezone explícito.
23. Feature flags não substituem permissões.
24. OpenAPI gap gate precede Admin integral.
25. A primeira entrega executável cobre Home, Product e Search.

## 85. Próximo artefato

**AR-22 — Repository/Monorepo Bootstrap & Executable Code Scaffold**

Deverá sair da especificação e criar código executável:

```text
workspace manifests
apps/web
apps/admin
apps/api
apps/worker
packages/ui
packages/api-client
packages/domain-kernel
packages/database
config TypeScript/ESLint
Docker/development bootstrap
environment templates
CI skeleton
health checks
first public frontend shell
first backend module skeleton
```
