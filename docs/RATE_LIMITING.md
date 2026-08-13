# Rate limiting HTTP

A API aplica uma janela fixa por instância antes da autenticação. Assim,
tentativas anônimas contra rotas administrativas também consomem limite. A
chave de cliente usa HMAC do endereço de rede e nunca mantém o IP em claro.

Classes e limites atuais:

| Classe | Janela | Limite |
|---|---:|---:|
| leitura pública | 60 s | 240 |
| busca | 60 s | 60 |
| redirecionamento comercial | 60 s | 120 |
| autenticação | 15 min | 20 |
| leitura administrativa | 60 s | 180 |
| escrita administrativa | 60 s | 60 |
| upload | 60 s | 20 |

Todas as respostas alcançadas pelo guard incluem `RateLimit-Limit`,
`RateLimit-Remaining`, `RateLimit-Reset` e `RateLimit-Policy`. Requisições
excedentes recebem HTTP `429` e `Retry-After`.

O armazenamento local é limitado a 50 mil buckets e falha fechado quando esse
teto é alcançado. Em implantação com múltiplas réplicas, o edge deve aplicar o
limite global adicional; este controle por processo continua como defesa em
profundidade. Configure `RATE_LIMIT_HASH_SALT` com um segredo independente de
pelo menos 32 caracteres em produção.

`TRUST_PROXY_HOPS` define quantos proxies controlados existem entre o cliente e
a API. O padrão é `0`, portanto `X-Forwarded-For` não é aceito de clientes
diretos. Em staging/produção, configure o número exato de saltos e mantenha a
API acessível somente pelo edge correspondente.

O smoke k6 em `test/performance/k6-public-smoke.js` cobre somente rotas públicas
existentes. Execute-o contra um candidato de staging:

```bash
k6 run -e BASE_URL=https://staging.example test/performance/k6-public-smoke.js
```
