# Unified Repository Topology

apps/web
  Next.js public portal and Admin UI.

apps/api
  NestJS domain/application API.

apps/worker
  asynchronous ingestion, AI, media, outbox and operational processing.

packages/contracts
  intentionally small cross-runtime DTO/type contracts.

sql
  ordered production migrations.

infra
  local and deployment infrastructure.

Principle: domain behavior belongs to the owning service/module. `contracts` must
not become a shared dumping ground for persistence models or provider SDK types.
