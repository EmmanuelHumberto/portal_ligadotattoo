# Validação da integração

Data: 2026-08-12

## Resultado local

- pacotes AR17–AR45 consolidados em um único monorepo;
- lockfile npm gerado;
- cadeia canônica de 15 migrations reconciliada;
- migrations aplicadas com sucesso em PostgreSQL 16 limpo;
- bootstrap aplicado com sucesso;
- API iniciada com todos os módulos NestJS registrados;
- health, catálogo público e busca pública verificados;
- frontend iniciado e smoke testado nas rotas `/`, `/maquinas` e `/api/health`;
- rotas administrativas rejeitam acesso anônimo com HTTP 401;
- Worker executando outbox e jobs PostgreSQL com retry, lease recovery e dead letter;
- roteamento idempotente validado de evento de catálogo até a projeção de busca;
- encerramento seguro do Worker validado com `SIGINT`;
- verificador OIDC/JWKS implementado com validação de assinatura e claims;
- upload S3/MinIO validado com SHA-256 e persistência PostgreSQL consistente;
- variantes WebP geradas pelo Worker com roteamento idempotente de jobs;
- entrega S3 privada assinada e interrupção de emissão após expiração de direitos;
- scheduler PostgreSQL idempotente e métricas operacionais por tipo de job;
- fixtures sintéticas idempotentes bloqueadas em produção;
- jornadas Playwright de catálogo, filtro, detalhe, oferta e comparação validadas;
- headers defensivos e rate limiting por classe conectados ao runtime da API;
- aquisição HTTPS com DNS pinado, proteção SSRF e redirects revalidados;
- readiness real de banco/schema e sobrevivência da API a falhas do pool;
- `npm run verify:full` aprovado.

## Cobertura automatizada atual

- domínio de fabricante: 2 testes;
- roteamento e fallback de IA: 4 testes;
- extração básica de conteúdo HTML/JSON: 2 testes;
- integração PostgreSQL do Worker e idempotência: 2 testes;
- OIDC/JWKS, issuer, audience, expiração e claims: 7 testes;
- upload, validação, compensação, URL assinada e integração MinIO: 7 testes;
- geração Sharp, configuração, chaves de retry e variantes S3: 4 testes;
- scheduler, frequências, deduplicação, polling, retenção e publicação atômica: 6 testes;
- política de ativação das fixtures sintéticas: 3 testes;
- Playwright público e proteção administrativa anônima: 6 testes executados;
- rate limiting, classificação de rotas e headers defensivos: 4 testes;
- política SSRF, IPs reservados, DNS misto, deadlines e redirects: 31 testes;
- readiness, timeouts, lifecycle e tratamento de falhas do pool: 10 testes;
- typecheck de API, Web e Worker;
- lint TypeScript/Next.js;
- builds de produção de API, Web e Worker;
- builds Docker locais de API, Web e Worker;
- auditoria npm sem vulnerabilidades conhecidas;
- validações estáticas de migrations, arquitetura e exposição de segredos.

## Ainda pendente para staging

- provisionar o issuer, cliente e capacidades no provedor OIDC de staging;
- definir alertas operacionais no ambiente de staging;
- decidir entre URLs S3 assinadas e CDN privada no ambiente de staging;
- executar os cenários Playwright privilegiados com sessão OIDC administrativa;
- executar testes de carga, segurança e rollback do AR38/AR44;
- produzir imagens imutáveis e evidências do ambiente de staging.

Este resultado promove o projeto de “formulação completa” para “baseline local
integrada e compilável”. Não representa aprovação para produção.
