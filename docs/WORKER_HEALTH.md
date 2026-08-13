# Saúde operacional do Worker

Cada processo Worker cria um UUID efêmero e persiste seu estado em
`ops.worker_heartbeat`. Nenhum hostname, endereço ou credencial é armazenado.

O registro contém:

- início do processo e quantidade de processadores;
- início e conclusão do último ciclo;
- duração do ciclo e quantidade de processadores que falharam;
- último contato e encerramento gracioso.

O Worker grava `STARTING` antes do primeiro ciclo, `RUNNING` após uma conclusão
e `STOPPED` durante `SIGTERM`/`SIGINT`. Registros encerrados são mantidos por
sete dias; registros abandonados por processo morto são removidos após 30 dias.

O readiness administrativo considera `UP` quando ao menos um Worker iniciou ou
concluiu um ciclo dentro de `WORKER_HEARTBEAT_STALE_SECONDS` (padrão 120 s).
Sem ciclo recente, o subsistema assíncrono fica `DEGRADED`; falha na própria
consulta fica `DOWN`. Essa condição não derruba `/health/ready`, pois catálogo e
leituras síncronas podem continuar atendendo enquanto a equipe recupera o
processamento assíncrono.

O dashboard agrega instâncias por estado, última atividade, duração máxima do
último ciclo e falhas do ciclo mais recente.
