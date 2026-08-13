# Scheduler durável do Worker

O scheduler roda dentro de cada réplica do Worker. Um advisory lock transacional
do PostgreSQL e chaves duráveis de deduplicação garantem que apenas uma réplica
agende cada ocorrência.

## Trabalhos automáticos

- publicação de conteúdo editorial cujo `scheduled_at` venceu;
- expiração de direitos de mídia a cada minuto;
- marcação de ofertas desatualizadas a cada cinco minutos;
- execução de alvos de ingestão conforme `schedule_key`.

Frequências aceitas em `ingestion.crawl_target.schedule_key`:

| Valor | Intervalo |
|---|---:|
| `5m` | 5 minutos |
| `15m` | 15 minutos |
| `1h` | 1 hora |
| `6h` | 6 horas |
| `24h` | 24 horas |

Valores desconhecidos não são executados. O scheduler também evita criar um
novo job de ingestão quando já existe outro `PENDING`, `RUNNING` ou `RETRY` para
o mesmo alvo.

Publicação editorial e emissão do evento de outbox são confirmadas na mesma
transação. O dashboard operacional expõe filas por tipo/status, idade do job
mais antigo, conteúdo editorial vencido e quantidade de alvos habilitados. A
readiness fica degradada quando surge job `DEAD` na última hora.

Jobs `DONE` são removidos em lotes de até 1000 após sete dias. A retenção pode
ser ajustada entre 1 e 90 dias; jobs `DEAD` não são removidos automaticamente:

```dotenv
WORKER_SCHEDULER_INTERVAL_MS=30000
WORKER_JOB_RETENTION_DAYS=7
```
