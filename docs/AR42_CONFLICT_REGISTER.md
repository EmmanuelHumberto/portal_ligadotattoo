# AR-42 Integration Conflict Register

AR-43 must close these expected integration classes:

- merge duplicate `layout.tsx`, `next.config` and global stylesheet examples;
- reconcile old relative imports with monorepo aliases/workspaces;
- consolidate repeated security headers between Next middleware and edge config;
- reconcile all historical SQL snippets into one dependency-safe migration chain;
- connect Nest modules for IAM, audit, catalog, knowledge, ingestion, AI, media,
  commerce, editorial, operations and analytics;
- replace placeholder Worker loop with concrete queue/outbox processors;
- choose the production queue/cache adapter and wire Redis where required;
- connect object-storage adapter and media rights projection;
- connect AI Provider Hub registry/adapters without importing provider SDKs into Web;
- normalize public/Admin API route prefixes;
- resolve Next.js version-specific lint/metadata/web-vitals APIs;
- provide ESLint configuration compatible with workspace versions;
- add actual test fixtures and Playwright storage-state bootstrap;
- verify Docker build contexts against the monorepo;
- reconcile development vs production media remote patterns;
- execute all AR-36/38 security and release regressions.

No item in this register is considered closed merely because a placeholder compiles.
