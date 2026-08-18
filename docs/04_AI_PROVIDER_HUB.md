# AI Provider Hub

The AI layer is provider-neutral.

Initial provider adapters:
- OpenAI;
- Anthropic;
- DeepSeek;
- Ollama (local, without per-request API cost).

The registry is extensible to future providers/models without coupling public
frontend code to a vendor.

A workload policy selects:
- preferred provider/model;
- fallback order;
- timeout;
- retry behavior;
- cost/latency constraints where configured;
- enabled/disabled state.

Rules:
1. credentials are backend-only;
2. frontend never selects using provider secrets;
3. every meaningful execution records workload/provider/model/status/latency;
4. provider errors are normalized;
5. fallback is workload policy, not scattered application logic;
6. AI-generated output has no automatic canonical/public authority;
7. outages degrade AI-assisted functionality rather than governance;
8. routing configuration can change without frontend rebuild.
9. migration `088` promotes `qwen3.5:0.8b` through Ollama to priority 1;
10. existing paid providers remain registered as fallback routes, preserving
    the Hub behavior when the local runtime is unavailable.

Conceptual interface:

AI Workload
    |
    v
Provider Hub
 |     |      |
 v     v      v
OpenAI Anthropic DeepSeek Ollama
    \   |   /
     Normalized Result
          |
          v
     Proposal / Assistive Output / Execution Record

## Local runtime

The Ollama adapter calls `OLLAMA_BASE_URL/api/chat`, requests non-streamed JSON
and records token counts in the existing execution ledger. Recommended settings
for the current CPU-only host:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=qwen3.5:0.8b
OLLAMA_CONTEXT_WINDOW=4096
OLLAMA_KEEP_ALIVE=5m
AI_DEFAULT_PROVIDER=ollama
AI_DEFAULT_MODEL=qwen3.5:0.8b
AI_FALLBACK_ORDER=deepseek,openai,anthropic
AI_PAID_FALLBACK_ENABLED=false
```

O perfil local é opt-in: `docker compose --profile local-ai up -d ollama
ollama-pull`. A imagem oficial exige ao menos 20 GB livres durante o primeiro
download; não ative o perfil em uma máquina abaixo desse limite.

In the production Compose network, use `OLLAMA_BASE_URL=http://ollama:11434`.
The runtime is limited to one parallel request and one loaded model so Portal,
PostgreSQL and Worker retain memory. The local model is assistive only and does
not acquire canonical or publication authority.

`AI_PAID_FALLBACK_ENABLED=false` is a runtime cost guard: paid adapters and
database routes remain intact, but the Hub skips them. Change it to `true` only
when automatic paid continuity is desired.
