# Validação da integração

Data: 2026-08-12

## Resultado local

- pacotes AR17–AR45 consolidados em um único monorepo;
- lockfile npm gerado;
- cadeia canônica de 14 migrations reconciliada;
- migrations aplicadas com sucesso em PostgreSQL 16 limpo;
- bootstrap aplicado com sucesso;
- API iniciada com todos os módulos NestJS registrados;
- health, catálogo público e busca pública verificados;
- frontend iniciado e smoke testado nas rotas `/`, `/maquinas` e `/api/health`;
- rotas administrativas rejeitam acesso anônimo com HTTP 401;
- Worker executando outbox e jobs PostgreSQL com retry, lease recovery e dead letter;
- roteamento idempotente validado de evento de catálogo até a projeção de busca;
- encerramento seguro do Worker validado com `SIGINT`;
- `npm run verify:full` aprovado.

## Cobertura automatizada atual

- domínio de fabricante: 2 testes;
- roteamento e fallback de IA: 4 testes;
- extração básica de conteúdo HTML/JSON: 2 testes;
- integração PostgreSQL do Worker e idempotência: 2 testes;
- typecheck de API, Web e Worker;
- lint TypeScript/Next.js;
- builds de produção de API, Web e Worker;
- builds Docker locais de API, Web e Worker;
- auditoria npm sem vulnerabilidades conhecidas;
- validações estáticas de migrations, arquitetura e exposição de segredos.

## Ainda pendente para staging

- configurar um verificador OIDC/JWKS real; o adaptador padrão rejeita tokens;
- conectar scheduler e métricas operacionais do Worker ao ambiente de staging;
- conectar storage S3/MinIO real ao `MEDIA_DELIVERY` e upload;
- preparar dados/seeds representativos para o catálogo;
- executar Playwright E2E com fixtures e sessão administrativa;
- executar testes de carga, segurança e rollback do AR38/AR44;
- produzir imagens imutáveis e evidências do ambiente de staging.

Este resultado promove o projeto de “formulação completa” para “baseline local
integrada e compilável”. Não representa aprovação para produção.
