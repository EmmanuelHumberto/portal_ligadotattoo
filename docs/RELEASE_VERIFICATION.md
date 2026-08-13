# Verificação reproduzível de release

`npm run verify:release` executa os gates do candidato e grava evidências em
`evidence/<RELEASE_ID>/`. O diretório é local e ignorado pelo Git; o pacote que
será arquivado ou anexado à release deve ser copiado pelo pipeline de entrega.

Variáveis obrigatórias:

- `RELEASE_ID`, `BASE_URL` e `API_BASE_URL` do candidato em staging;
- `DATABASE_URL` e `TEST_DATABASE_URL` apontando para banco isolado de teste;
- endpoint e credenciais `TEST_OBJECT_STORAGE_*` para armazenamento isolado.

O fluxo executa migrações, `verify:full`, auditoria de dependências, Playwright
contra os serviços externos, smoke público e k6. Os servidores locais do
Playwright são desativados nesse modo, garantindo que o teste realmente atinja
o candidato indicado.

URLs HTTP só são aceitas em ensaio local explícito com `RC_ALLOW_HTTP=true`.
`RC_SKIP_INSTALL=true` pode ser usado quando `npm ci` já ocorreu no mesmo job.
Por padrão, ausência do k6 falha o gate; apenas diagnósticos que não pretendem
aprovar uma release podem definir `RC_REQUIRE_K6=false`.

Depois que a configuração inicial é aceita, `verification-summary.txt` sempre
registra `PASS` ou `FAIL`, SHA, horários, alvos e situação do gate de carga. Ele não substitui evidência de
backup/restore, revisão de segurança independente, credenciais reais de IA ou
aprovação humana de produção.
