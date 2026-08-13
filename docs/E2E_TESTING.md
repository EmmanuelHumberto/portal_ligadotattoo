# Testes E2E locais

Os testes Playwright exercitam o Web e a API reais com catálogo, busca,
fabricantes e conteúdo editorial sintéticos.
As fixtures são identificadas pelo prefixo `Fixture`, são idempotentes e nunca
podem ser habilitadas com `NODE_ENV=production`. A API também as marca como
sintéticas para que a interface nunca as apresente como dados verificados.

## Preparação

```bash
docker compose -f infra/compose.yml up -d
set -a && . ./.env && set +a
npm run db:migrate
BOOTSTRAP_FIXTURES=true npm run bootstrap
npx playwright install chromium
npm run test:e2e
```

O Playwright compila e inicia API e Web automaticamente nas portas
configuradas. Use
`PLAYWRIGHT_API_BASE_URL` e `PLAYWRIGHT_WEB_BASE_URL` para apontar para serviços
já existentes.

O cenário administrativo anônimo é sempre executado e exige `401` ou `403`.
Os cenários privilegiados só rodam quando
`PLAYWRIGHT_ADMIN_STORAGE_STATE` aponta para um estado Playwright criado por um
login OIDC real; não existe bypass de autenticação para testes. O cenário de
autocomplete também falha se a CSP impedir a hidratação React, protegendo a
integração do nonce.
