# AR-42 Decisions

1. The integrated product is a TypeScript npm-workspace monorepo.
2. Web uses Next.js; API uses NestJS; Worker remains an independent Node runtime.
3. PostgreSQL is the canonical relational store.
4. Redis is declared for queue/cache integration.
5. Object storage is represented locally by an S3-compatible service.
6. Runtime configuration is validated at service startup.
7. SQL migrations use one globally ordered chain.
8. AI Provider Hub remains backend-only and vendor-neutral.
9. Shared contracts are deliberately narrow.
10. AR-43 owns exhaustive integration closure and build validation.

## Next
AR-43 — Integration Fixes & Full Build Validation.
