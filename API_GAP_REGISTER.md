# AR-20 — API Additive Gap Register

Status: RESOLVED (2026-08-13)

AR-20 identificou contratos de leitura administrativa ausentes no baseline
AR-19. Estado de cada item após o fechamento do Módulo 1:

- GET /admin/claims — implementado (`KnowledgeController.claims`)
- GET /admin/claims/{id} — implementado (`KnowledgeController.claimDetail`)
- GET /admin/canonical-proposals — implementado (`KnowledgeController.proposals`)
- GET /admin/canonical-proposals/{id} — implementado (`KnowledgeController.proposal`)
- GET /admin/media — implementado (`MediaLibraryController.list`)
- GET /admin/sources — implementado (`IngestionController.sources`)
- GET /admin/ingestion/runs — implementado (`IngestionController.runs`)
- GET /admin/editorial — implementado (`EditorialController.adminList`)
- GET /admin/editorial/{id} — implementado (`EditorialController.adminDetail`)
- GET /admin/listings — implementado (`CommerceController.listings`)
- GET /admin/ai/executions — implementado (`AIAdminController.executions`)
- GET /admin/audit — implementado (`OperationsController.audit`)

Todos os endpoints aditivos estão presentes. O contrato AR-20 está fechado.
