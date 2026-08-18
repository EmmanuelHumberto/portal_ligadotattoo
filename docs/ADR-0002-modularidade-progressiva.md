# ADR-0002 — Modularidade progressiva e limites de componentes

Status: Aceito
Data: 2026-08-17

## Contexto

O portal cresceu rapidamente sobre uma boa separação física entre Web, API e
Worker, mas parte da separação interna não acompanhou esse crescimento. Há
controllers que executam regras e SQL diretamente, handlers de descoberta que
concentram aquisição, classificação, persistência, mídia e governança, contratos
HTTP mantidos manualmente e pacotes compartilhados quase sem adoção.

"Componentizar ao máximo" não significa criar o maior número possível de
arquivos. Fragmentação excessiva aumenta navegação, abstrações sem consumidor e
acoplamento indireto. Nesta decisão, componentizar significa maximizar coesão,
testabilidade e substituição independente em torno de responsabilidades estáveis.

## Decisão

Adotar modularidade progressiva por domínio, usando refatoração incremental
(strangler) e preservando os runtimes existentes. Não haverá reescrita total.

### Limites obrigatórios

1. **Controller é adaptador HTTP.** Faz parsing/validação de DTO, invoca um caso
   de uso e traduz o resultado. Controller novo não acessa `PG_POOL`, S3 ou
   provedores externos diretamente.
2. **Caso de uso controla a transação.** Toda mutação que altera mais de uma
   tabela, auditoria, outbox ou projeção executa em uma única unidade
   transacional, salvo consistência eventual explicitamente documentada.
3. **Domínio preserva autoridade.** Aquisição e IA produzem snapshot, claim,
   candidato ou proposta. Somente um caso de uso de governança promove conteúdo
   canônico, mídia elegível ou projeção pública.
4. **Worker orquestra portas.** Transporte HTTP, extração, classificação,
   persistência, armazenamento e política de direitos são componentes distintos.
   Um handler coordena esses componentes e não implementa todos eles.
5. **Contrato é executável.** OpenAPI é o contrato HTTP canônico. DTOs do Web e
   do Worker devem ser gerados dele ou implementados em `packages/contracts`
   com validação em runtime. `any` não é aceito em novas fronteiras HTTP, jobs ou
   eventos.
6. **Compartilhamento exige fronteira real.** Código vai para pacote compartilhado
   somente quando é usado por dois runtimes ou representa contrato estável.
   Persistência e modelos internos permanecem no módulo proprietário.
7. **Web separa dados e apresentação.** Feature adapters convertem DTOs em view
   models; componentes de UI recebem props tipadas e não conhecem endpoints.
   Elementos reutilizáveis vivem em `components`/`packages/ui`; componentes
   específicos permanecem próximos da rota.
8. **Composição fica nas raízes.** `FeaturesModule` e `createRuntimeProcessors`
   podem montar módulos, mas não conter regra de negócio.
9. **Uma capacidade, uma implementação.** Facades legadas, endpoints `v2` e
   stacks paralelos só permanecem durante uma migração com consumidor, prazo e
   remoção explícitos.
10. **Fitness functions protegem os limites.** O gate deve detectar pelo menos:
    SQL em controllers, fetch de provedor fora de adapters, promoção canônica em
    aquisição/IA, credenciais de desenvolvimento em produção, drift entre
    OpenAPI e rotas e artefatos gerados incluídos em scans de fonte.

### Sinais para extração

São sinais, não metas cegas:

- arquivo com mais de 250 linhas e mais de uma responsabilidade;
- classe com mais de cinco dependências operacionais;
- mutação com SQL em três ou mais agregados/tabelas;
- mesma transformação ou contrato repetido em dois runtimes;
- componente de página que mistura consulta, normalização e apresentação;
- teste que só consegue validar uma regra inicializando banco, rede e storage.

### Sequência de adoção

1. Congelar novas violações e corrigir riscos de segurança/autoridade.
2. Reconciliar OpenAPI, DTOs, validação e erros HTTP.
3. Decompor descoberta de catálogo e tradução, mantendo os jobs existentes.
4. Extrair módulos Nest por domínio e casos de uso transacionais dos controllers.
5. Tipar adapters/view models do Web e consolidar componentes visuais.
6. Remover stacks e endpoints legados após migração dos consumidores.

Cada etapa deve manter migrations e APIs compatíveis ou declarar uma versão e
janela de migração. Refatoração não autoriza alterar dados canônicos silenciosamente.

## Consequências

### Positivas

- preserva o investimento funcional já feito;
- reduz o risco de uma reescrita sem paridade;
- torna regras de autoridade, custo e direitos testáveis isoladamente;
- permite substituir provedor, storage ou extractor sem reescrever o domínio;
- reduz drift entre Web, API, Worker e documentação.

### Custos

- haverá período temporário com adapters antigos e novos;
- contratos e testes precisam ser escritos antes de algumas extrações;
- entregas de novas features devem ceder capacidade para estabilização;
- métricas de progresso passam a incluir redução de violações, não só telas e
  quantidade de dados coletados.

## Alternativas rejeitadas

- **Reescrita total:** alto risco de perder regras de segurança, migrations,
  operação e comportamento já validado; não há evidência de que o núcleo seja
  irrecuperável.
- **Microserviços agora:** distribui inconsistência e custo operacional antes de
  estabilizar contratos internos.
- **Extrair tudo para packages:** cria um monólito compartilhado e enfraquece a
  propriedade dos domínios.
- **Manter apenas organização por arquivos:** não corrige transações, autoridade,
  contratos nem dependências reais.
