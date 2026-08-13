# AR-22 — Repository/Monorepo Bootstrap & Executable Code Scaffold

This is the implementation bootstrap derived from AR-18 through AR-21.

## Frozen structure
- `apps/web`: public Next.js portal
- `apps/admin`: authenticated Next.js admin
- `apps/api`: NestJS API target
- `apps/worker`: jobs/outbox/ingestion target
- `packages/ui`: shared dark-first design system
- `packages/api-client`: generated OpenAPI client boundary
- `packages/domain-kernel`: framework-independent domain primitives
- `packages/database`: transaction/database boundary
- `packages/config`: shared configuration

## Infrastructure
Local bootstrap includes PostgreSQL 16 and S3-compatible MinIO. Provider credentials are represented only as backend secret references. OpenAI, Anthropic and DeepSeek remain configurable through the AI Provider Hub; no provider SDK belongs in Web/Admin.

## Security constraints
- no AI API keys in frontend bundles
- OIDC admin authentication
- strict TypeScript
- SSRF-safe acquisition remains a backend requirement
- outbox/jobs remain separate from request controllers

## Status
This is a scaffold, not a production-complete application. Concrete NestJS modules, Next.js routes, migrations, generated OpenAPI client and tests are the next implementation layers.

## Next artifact
AR-23 — Backend Foundation Executable Slice: NestJS bootstrap, config, PostgreSQL adapter, transaction manager, health endpoints, Problem Details, audit/outbox/job foundations and first Catalog vertical slice.
