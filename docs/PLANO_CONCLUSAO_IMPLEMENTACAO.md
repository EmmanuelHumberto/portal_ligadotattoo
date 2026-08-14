# Plano de conclusão da implementação — Portal Liga do Tattoo

Data: 2026-08-13
Status: proposta (aguardando aprovação para execução)
Autor: análise de engenharia sobre o repositório `ligadotattoo/Portal_ligadotattoo/repository`

## Contexto

O projeto está em "baseline local integrada e compilável": a formulação
arquitetural (AR-01 a AR-45) está completa, e o núcleo (Web + API + Worker +
PostgreSQL + MinIO) roda e passa `npm run verify:full` localmente. Não há
evidência de staging nem de produção. Produção está NO-GO por ausência de
evidência; o Admin está parcial e somente leitura.

Este documento propõe um plano modular para concluir a implementação até a
decisão de GO, em 9 módulos (M0–M8) com aceites e dependências explícitos.

## Fatos verificados no código (âncoras do plano)

- Backend já expõe mutações (claims, proposals, editorial, media, sources,
  listings, ai-draft) protegidas por `@RequireCapability`.
- Faltam apenas 3 endpoints de leitura admin (contrato AR-20):
  `GET /admin/claims/:id`, `GET /admin/media`, `GET /admin/editorial/:id`.
- CSRF existe como `APP_GUARD` (`OriginCsrfGuard`), mas: (a) requisições com
  `Authorization: Bearer` pulam o CSRF; (b) nenhum código emite o cookie
  `pt_csrf` — `csrfCookieOptions()` está definido e órfão.
- `apps/web/lib/admin-api.ts` só faz GET; não há helper de mutação.
- Telas admin são 100% RSC read-only; 0 formulários/client components.
- `apps/admin/` e `apps/web/src/` são placeholders (só `README.md`);
  `pnpm-workspace.yaml` é residual (o projeto usa npm workspaces).

---

## Módulo 0 — Saneamento estrutural (quick win, baixo risco)

**Objetivo:** remover ambiguidades que atrapalham contribuidores novos.

- Remover o placeholder `apps/admin/` (sem `package.json`).
- Remover `apps/web/src/README.md` ou converter `apps/web/src` no destino real
  (padrão `src/app`), conforme decisão.
- Remover `pnpm-workspace.yaml` residual (projeto é npm workspaces:
  `package-lock.json` + `"workspaces"`).
- Documentar a numeração esparsa das migrations em `sql/README.md`
  (001, 010, 020, 024…048) explicando a herança de múltiplas fontes.

**Aceite:** `npm run verify:full` verde; sem workspaces fantasmas.

---

## Módulo 1 — Fechar o contrato de API admin (leitura)

**Objetivo:** zerar o `API_GAP_REGISTER.md` (AR-20).

Endpoints ausentes e lacunas correspondentes:

- `GET /admin/claims/:id` — falta `KnowledgeQuery.claimById` (`claims()` existe).
- `GET /admin/media` — falta `MediaRepository.list()` (só `insert`/`updateRights`).
- `GET /admin/editorial/:id` — falta `EditorialQuery.adminById` (`adminList()` existe).

**Mudanças:**

1. Adicionar os 3 métodos de query/repositório.
2. Adicionar os 3 `@Get` nos controllers com `@RequireCapability`
   (`claim.read`, `media.review`, `editorial.read`).
3. Atualizar `portal.openapi.yaml`, `ENDPOINT_MANIFEST.md` e marcar
   `API_GAP_REGISTER.md` como fechado.
4. Testes unit (query) + integração (HTTP 200 autorizado / 401 anônimo).

**Aceite:** `npm run verify:full` verde; os 3 endpoints respondem no contrato.

**Dependência:** nenhuma. **Esforço:** S.

---

## Módulo 2 — Sessão admin e perfil `/admin/me`

**Objetivo:** fechar o elo de sessão do Admin e expor o perfil do ator.

Nota de arquitetura: o login é delegado ao adaptador OIDC da implantação
(`ADMIN_LOGIN_URL`), que grava `pt_session` ou encaminha o header; o Next.js
faz proxy Bearer. Implementar o fluxo OIDC no Next.js conflitaria com esse
design e foi descartado.

**Mudanças (concluídas em 2026-08-13):**

1. `GET /admin/me` (`MeController`) — projeta actorId, externalSubject,
   capabilities e authenticationLevel do ator autenticado.
2. `AdminShell` (Next.js) consulta `/admin/me` e mostra sessão + links de
   login/logout (`ADMIN_LOGIN_URL` / `ADMIN_LOGOUT_URL`).
3. Documentado o modo de sessão e a fronteira CSRF em
   `docs/OIDC_CONFIGURATION.md`.

**CSRF do analytics (resolvido em 2026-08-13):** `POST /analytics/events` é
mutação pública protegida por cookie CSRF. O proxy emite o cookie `pt_csrf`
(`httpOnly:false`) nas respostas de página, e o route handler
`/api/analytics/events` exige a presença do cookie — o `sendBeacon` same-origin
envia cookies automaticamente, e requisições cross-site sem o cookie recebem
403. Mutações admin Bearer server-side pulam CSRF por design (o guard
`OriginCsrfGuard` retorna `true` para Bearer).

**Aceite:** `GET /admin/me` responde 200 com Bearer e 401 sem; shell exibe a
sessão; documentação registra o modo.

**Dependência:** Módulo 0. **Esforço:** S (revisado de M).

---

## Módulo 3 — Mutações admin + telas de curadoria

**Objetivo:** transformar o Admin de leitura em curadoria funcional.

**Mudanças:**

1. Ampliar `apps/web/lib/admin-api.ts` com `adminMutate(path, method, body)`
   (inclui header `X-CSRF-Token` quando em modo cookie).
2. Ligar as mutações já existentes no backend às telas:
   - Conhecimento: registrar claim, criar/decidir proposal;
   - Editorial: criar, submeter, aprovar, agendar, publicar, AI-draft;
   - Mídia: upload, register, definir direitos;
   - Ingestão: criar fonte; Comércio: preços.
3. Criar as rotas ausentes da árvore alvo (`ROUTE_MANIFEST.md`):
   `/admin/produtos`, `/admin/fontes`, `/admin/problemas-tecnicos`,
   `/admin/laboratorio`, `/admin/operacoes`, e sub-rotas
   `/admin/ia/{provedores,modelos,workloads,roteamento,execucoes}`.
4. Filtros, detalhes (usando os 3 endpoints do Módulo 1) e paginação.

**Progresso (2026-08-13):** fluxo editorial completo (adminMutate Bearer
server-side, classifyAdminStatus, server actions criar/submeter/aprovar/agendar/
publicar, form de criação, detalhe `/admin/editorial/[id]` com workflow, links
no AdminCollection); fluxo de knowledge (registrar claim, criar/decidir proposta,
detalhe `/admin/conhecimento/propostas/[id]`); `GET /admin/products` implementado
(AdminProductQuery + controller) destravando `/admin/produtos`; criar fonte
(`/admin/fontes`); definir direitos de mídia (`/admin/midia`, com `version` na
listagem); rotas read-only `/admin/operacoes`, `/admin/ia/execucoes`; registrar
preço em commerce (`POST /admin/listings/:id/prices` + tela `/admin/comercio`);
technical service e laboratory reconciliados no runner (migrations `sql/049` e
`sql/050`, módulos `ServiceController`/`LaboratoryController`, telas
`/admin/problemas-tecnicos` e `/admin/laboratorio`).

**Módulo 3 completo (2026-08-13).** Inclui o feedback inline de erro nas
mutações (`AdminActionForm` com `useActionState`, `ActionResult` e mensagens
por status em todos os formulários de curadoria).

**Aceite:** jornadas Playwright privilegiadas (criar claim → proposta → decisão;
publicar editorial; upload de mídia) verdes; typecheck/lint verdes.

**Dependência:** Módulos 1 e 2. **Esforço:** L.

---

## Módulo 4 — Dados reais e superfícies públicas

**Objetivo:** substituir fixtures sintéticas por conteúdo real.

**Mudanças:** importação/seed de catálogo, editorial, mídia e fabricantes reais;
validação de busca/SEO/structured data com o conteúdo final.

**Progresso (2026-08-13):** editorial real (drafts de IA com capa/`coverUrl`),
mídia real (imagens no MinIO), fontes/fabricantes reais (coleta 24h, estratégia
"última postagem" + dedup), e catálogo de máquinas real (migration `064`: 10
fabricantes + 19 modelos + 10 sellers + 19 listings/preços, endpoint
`/public/products` retorna 21 modelos). SEO/structured data implementado
(metadata dinâmico via `generateMetadata` nas páginas de detalhe, JSON-LD com
imagem de capa via `coverUrl`, `productJsonLd` com ofertas na página de
máquina). **Resta (AR35):** fine-tuning de a11y/performance e validação de
busca com o conteúdo final.

**Dependência:** Módulo 3. **Esforço:** M.

---

## Módulo 5 — Verificação e evidência de release

**Objetivo:** transformar "passa local" em evidência imutável.

**Mudanças:**

- Playwright privilegiado com sessão OIDC real de staging (hoje só público +
  401 anônimo).
- Testes de carga (AR38), segurança (AR36), rollback (AR37/AR39).
- Validar provedores de IA (OpenAI/Anthropic/DeepSeek) com credenciais de
  staging controladas (R4 do risk register).
- Preencher as matrizes `test/AR36_*`, `AR38_*`, `AR44_*` com resultados.

**Aceite:** `verify:release` produz pacote de evidências
(`docs/RELEASE_VERIFICATION.md`).

**Dependência:** Módulos 2–4. **Esforço:** L.

---

## Módulo 6 — Staging e infra imutável

**Objetivo:** candidato de staging reproduzível.

**Mudanças:** provisionar issuer/cliente/capabilities no OIDC de staging;
decidir S3 assinado vs. CDN privada; alertas; imagens imutáveis + CI/CD de
release.

**Aceite:** `AR44_STAGING_ACCEPTANCE.md` aprovado com evidência.

**Dependência:** Módulo 5. **Esforço:** L.

---

## Módulo 7 — Operações e segurança final

**Objetivo:** prontidão de produção.

**Mudanças:** backup/restore operacional, monitoramento/on-call, dashboards,
playbooks de incidente (AR39); revisão de segurança independente; classificação
de achados.

**Aceite:** `AR45_FINAL_ACCEPTANCE_MATRIX.md` seções C e D atendidas.

**Dependência:** Módulo 6. **Esforço:** M.

---

## Módulo 8 — Decisão GO

**Objetivo:** registrar o veredito com evidência, não com formulação.

**Mudanças:** consolidar evidências dos Módulos 5–7, classificar achados
restantes, registrar `GO`/`CONDITIONAL_GO`/`NO_GO` em `AR45_GO_LIVE_DECISION.md`.

**Aceite:** decisão assinada com digests verificados.

---

## Sequenciamento crítico

```
M0 (saneamento) ──> M1 (API leitura) ──> M2 (sessão/CSRF) ──> M3 (Admin mutações)
                                                                       │
                                              M4 (dados reais) <──────┘
                                                                       │
M5 (evidência) ──> M6 (staging) ──> M7 (operações) ──> M8 (GO)
```

- Caminho crítico de código: **M1 → M2 → M3** (trabalho de implementação real).
- **M4–M8** são majoritariamente operacionais/evidência — dependem de infra e
  OIDC externos, não de mais código de núcleo.
- Quick wins sem infra: **M0 e M1**.

---

## Riscos e observações

- `apps/admin/` e `apps/web/src/` são placeholders; consolidar antes de crescer
  o Admin (M3).
- Cobertura de testes desbalanceada: fabricante (2), SSRF (31). Reforçar os
  domínios de negócio (claims/canonical, editorial) antes do GO.
- A numeração esparsa das migrations deve ser documentada para evitar
  interpretações erradas no próximo engenheiro.
- Nenhum `TODO`/`FIXME` no código; pendências vivem em documentação — manter
  assim.
