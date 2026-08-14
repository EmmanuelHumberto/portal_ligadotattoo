# Plano — Etapa final: portal funcional, pendente apenas hospedagem

Data: 2026-08-13
Status: proposta (pronta para execução das etapas locais)

## Objetivo

Deixar o portal funcionando de ponta a ponta, com a **hospedagem** (deploy,
infra gerenciada, OIDC real e dados reais) como a única etapa pendente.

## Estado atual (já concluído)

- **Código de aplicação (Módulos 1–3): completo e validado.**
  - API (catalog, editorial, knowledge, commerce, media, ingestion, ai,
    analytics, ops, service, laboratory), Worker durável, Web público + Admin.
  - Mutações de curadoria com controle de concorrência e feedback inline.
  - 18 migrations reconciliadas (incluindo `service` e `laboratory`).
  - OIDC/JWKS validation, sessão Bearer server-side, `/admin/me`.
- **Empacotamento pronto:** `infra/docker/Dockerfile.{api,web,worker}`,
  `infra/nginx/`, `infra/k8s/`, `infra/compose/`, `infra/staging/`, e os
  scripts `staging-preflight.sh`, `staging-deploy.sh`, `staging-smoke.sh`,
  `staging-rollback.sh`, `create-release-evidence.sh`, `final-acceptance.sh`.
- **Portal local rodando:** Web (3000), API (3001), Worker + dados de
  demonstração (fixtures sintéticas).

## Decisão registrada

- **Sem provedor OIDC de teste local.** O OIDC real será provisionado e
  configurado diretamente na hospedagem, seguindo o contrato já documentado em
  `docs/OIDC_CONFIGURATION.md`. Localmente, as rotas públicas funcionam e as
  rotas admin rejeitam anônimo com 401 (fail-closed) — comportamento esperado.

## Etapas restantes

### Etapa 1 — Evidência local (executável agora, sem infra)

1. `npm run verify:full` — gate completo (migrations, arquitetura, segredos,
   typecheck, lint, testes, builds de produção).
2. `npm run test:e2e` — jornadas Playwright públicas (com fixtures).
3. Commit do trabalho acumulado (~50 arquivos), com mensagem descritiva.

### Etapa 2 — Documentação de hospedagem (executável agora)

4. Criar `docs/DEPLOYMENT.md` com o passo-a-passo completo:
   - build das imagens e push ao registry;
   - variáveis de produção (secrets) e `SESSION_SIGNING_SECRET`/`RATE_LIMIT_HASH_SALT`;
   - **provisionamento do OIDC real** (issuer, client, capabilities,
     `ADMIN_LOGIN_URL`/`ADMIN_LOGOUT_URL`);
   - migrations + bootstrap (sem fixtures em produção);
   - deploy (k8s ou compose), smoke, rollback, monitoramento.

### Etapa 3 — OIDC real (pendente de hospedagem — executado no provedor)

5. Provisionar o provedor de identidade (Keycloak/Auth0/Entra/oauth2-proxy).
6. Criar o client (Authorization Code + PKCE), definir issuer e audience.
7. Emitir a claim de capabilities (`capabilities`) e a de ator no access token.
8. Preencher `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URI`,
   `ADMIN_LOGIN_URL`, `ADMIN_LOGOUT_URL` no ambiente de hospedagem.

### Etapa 4 — Hospedagem (pendente — executado no provedor)

9. Provisionar infra gerenciada: compute, PostgreSQL, Redis, S3/CDN.
10. Configurar TLS e domínio.
11. Deploy das imagens imutáveis + secrets.
12. Rodar migrations e bootstrap com dados reais (sem fixtures sintéticas).
13. Smoke público + admin, monitoramento/alertas, on-call.

## O que fica pendente de hospedagem (resumo)

- Provedor de identidade OIDC (configurado lá, não local).
- Infra gerenciada (compute, banco, S3/CDN) e TLS/domínio.
- Dados reais (catálogo, editorial, mídia) — Módulo 4.

## Critério de conclusão

O portal está "funcionando, pendente apenas hospedagem" quando as Etapas 1 e 2
estiverem executadas (evidência + documentação), e as Etapas 3 e 4 forem
executadas no provedor de hospedagem com o OIDC real e os dados reais.
