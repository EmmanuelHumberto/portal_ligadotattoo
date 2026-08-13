# Portal Liga do Tattoo

Monorepo executável consolidado a partir dos artefatos AR17–AR45.

## Componentes

- `apps/web`: frontend Next.js;
- `apps/api`: API NestJS modular;
- `apps/worker`: worker independente;
- `packages/contracts`: contratos TypeScript compartilhados;
- `sql`: cadeia canônica e ordenada de migrations executáveis;
- `infra/compose.yml`: PostgreSQL, Redis e MinIO para desenvolvimento local.

Os arquivos em `database/` preservam o pacote físico AR17 como referência. O
runner atual usa exclusivamente a cadeia reconciliada em `sql/`.

## Requisitos

- Node.js 20 ou superior;
- npm 11 ou superior;
- Docker com Compose.

## Desenvolvimento local

```bash
cp .env.example .env
docker compose -f infra/compose.yml up -d
npm ci
set -a && . ./.env && set +a
npm run db:migrate
npm run bootstrap
npm run dev
```

Se a porta `5432` estiver ocupada, defina `POSTGRES_PORT` e ajuste a porta em
`DATABASE_URL` antes de iniciar o Compose.

## Validação

```bash
npm run verify:full
```

O gate executa validação das migrations, limites arquiteturais e de segredos,
typecheck, lint, testes unitários e builds de produção.

Consulte [docs/INTEGRATION_VALIDATION.md](docs/INTEGRATION_VALIDATION.md) para o
estado validado e as pendências conhecidas. Para proteger as rotas
administrativas, consulte [docs/OIDC_CONFIGURATION.md](docs/OIDC_CONFIGURATION.md).
O fluxo de mídia está em [docs/MEDIA_STORAGE.md](docs/MEDIA_STORAGE.md).
