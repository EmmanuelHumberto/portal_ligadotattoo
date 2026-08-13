# Status de implementação do Portal Tattoo

Atualizado em 2026-08-13.

## Estado por fase

| Fase | Estado | Evidência atual |
|---|---|---|
| Formulação AR-01–AR-45 | Completa | 45 de 45 artefatos planejados |
| Plataforma integrada | Em andamento, núcleo local aprovado | Web, API, Worker, PostgreSQL, MinIO, migrations e gates automatizados |
| Experiência pública | Baseline ampla | Home, busca, catálogo, produto, comparação, marcas, notícias, blog e eventos funcionais |
| Administração | Parcial | Dashboard inicial e APIs protegidas; demais workspaces ainda não estão completos |
| Staging | Pendente | Depende de infraestrutura, OIDC, imagens imutáveis e execução do candidato |
| Produção | Pendente/NO-GO por ausência de evidência | Não há autorização de lançamento registrada |

## Núcleo já implementado

- monorepo compilável com lockfile e 16 migrations ordenadas;
- autenticação OIDC/JWKS e autorização por capacidades;
- catálogo, knowledge, editorial, ingestão, comércio, mídia, analytics e operações na API;
- jobs/outbox PostgreSQL duráveis, scheduler, retries, dead letter e heartbeat do Worker;
- upload S3/MinIO, variantes WebP e entrega privada condicionada a direitos;
- proteção SSRF, rate limiting, headers defensivos e readiness real;
- fixtures sintéticas, testes unitários/integrados e jornadas Playwright públicas;
- busca/autocomplete, fabricantes e editorial público com projeções navegáveis;
- CSP estrita com nonce por requisição e hidratação das ilhas client-side validada;
- gate de release capaz de testar um candidato externo e guardar evidências.

## Próximos blocos de implementação

1. Implementar a superfície pública agregada de ofertas e enriquecer o conteúdo real.
2. Expandir o Admin para catálogo, knowledge, mídia, ingestão, editorial, IA e auditoria.
3. Executar Playwright privilegiado com OIDC real em staging.
4. Automatizar imagens imutáveis, scans, carga, rollback e pacote de evidências.
5. Validar backup/restore, alertas, dashboards e operação de incidentes.
6. Realizar revisão de segurança independente e registrar decisão final de GO.

`IN_PROGRESS_LOCAL_GATES_PASS` significa que o núcleo passa localmente, não que
o candidato de staging ou a produção estejam aprovados.
