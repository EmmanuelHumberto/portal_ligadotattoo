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
BOOTSTRAP_FIXTURES=true npm run bootstrap
npm run dev
```

Abra `http://localhost:3000`. O comando raiz inicia Web, API e Worker juntos;
`Ctrl+C` encerra os três processos. MinIO fica em `http://localhost:9001`.
A API usa o compilador TypeScript incremental para preservar os metadados de
injeção do NestJS durante o hot reload.

Para iniciar sem dados sintéticos, execute `npm run bootstrap` sem a variável.
As instruções e os testes de navegador estão em
[docs/E2E_TESTING.md](docs/E2E_TESTING.md).

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
O agendamento do Worker está em
[docs/WORKER_SCHEDULER.md](docs/WORKER_SCHEDULER.md).
Os limites HTTP e o smoke de carga estão em
[docs/RATE_LIMITING.md](docs/RATE_LIMITING.md).
A fronteira SSRF da ingestão está documentada em
[docs/SAFE_INGESTION.md](docs/SAFE_INGESTION.md).
Heartbeat e saúde assíncrona do Worker estão em
[docs/WORKER_HEALTH.md](docs/WORKER_HEALTH.md).
O gate reproduzível e o pacote de evidências de release estão em
[docs/RELEASE_VERIFICATION.md](docs/RELEASE_VERIFICATION.md).
O avanço consolidado do roadmap está em
[docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
As rotas e projeções públicas de descoberta estão em
[docs/PUBLIC_DISCOVERY.md](docs/PUBLIC_DISCOVERY.md).
