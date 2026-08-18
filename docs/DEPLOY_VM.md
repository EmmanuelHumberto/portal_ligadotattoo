# Deploy em VM própria (Docker Compose + Cloudflare Tunnel ou Caddy)

Guia para hospedar o **Portal Ligado Tattoo** numa VM Linux usando Docker
Compose. O caminho de menor custo usa **Cloudflare Tunnel**, sem portas de
entrada abertas; Caddy continua disponível para uma VM com IP público. Uma VM
Oracle Always Free pode ser usada, sujeita à capacidade e aos limites vigentes.

## Visão geral

```
Internet
   │
   ├─ https://seu-dominio.com.br       → Tunnel/Caddy → web
   ├─ https://api.seu-dominio.com.br   → Tunnel/Caddy → api
   └─ https://media.seu-dominio.com.br → Tunnel/Caddy → minio

Rede interna: postgres + redis + api + worker + web + minio + ollama
```

## Pré-requisitos

- Uma VM Linux x86_64 ou ARM64 com **Docker** e **Docker Compose v2**.
- Um **domínio** (ex.: `seu-dominio.com.br`) gerenciado no Cloudflare para
  `tunnel`, ou com DNS apontando para a VM para `direct`.
- Sem IA local: pelo menos 10 GB livres.
- Com o perfil `local-ai`: pelo menos 20 GB livres; 30 GB ou mais são recomendados para acomodar a imagem oficial, o modelo e os arquivos temporários do primeiro download.
- Para `direct`: portas 80/443 abertas. Para `tunnel`: nenhuma porta de entrada.

## 1. Preparar a VM

```bash
# Instalar Docker + Compose (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # depois saia e entre de novo no shell
```

Se usar o perfil `direct`, crie os registros DNS apontando para o IP da VM:

| Tipo | Nome | Valor |
|------|------|-------|
| A | `seu-dominio.com.br` | IP da VM |
| A | `api.seu-dominio.com.br` | IP da VM |
| A | `media.seu-dominio.com.br` | IP da VM |

## 2. Baixar o código

```bash
git clone https://github.com/EmmanuelHumberto/portal_ligadotattoo.git
cd portal_ligadotattoo/infra/production
```

## 3. Configurar as variáveis

```bash
cp .env.example .env
nano .env
```

Preencha no mínimo:

- `SITE_DOMAIN` → seu domínio.
- `POSTGRES_PASSWORD` → senha forte.
- `INTERNAL_API_KEY` → gere com `openssl rand -hex 32`.
- `SESSION_SIGNING_SECRET`, `RATE_LIMIT_HASH_SALT`, `ANALYTICS_HASH_SALT` → gere com `openssl rand -hex 32`.
- `OBJECT_STORAGE_ACCESS_KEY` / `OBJECT_STORAGE_SECRET_KEY` → credenciais do MinIO.
- `COMPOSE_PROFILES=tunnel,local-ai` → publicação sem portas e Ollama local.
- `CLOUDFLARE_TUNNEL_TOKEN` → token do tunnel gerenciado.

O `DEV_ADMIN_TOKEN` deve ficar vazio em produção. Sem OIDC, o portal público
funciona e o painel administrativo permanece fechado.

### Configurar o Cloudflare Tunnel

No painel Cloudflare Zero Trust, crie um tunnel e adicione três hostnames:

| Hostname público | Serviço interno |
|---|---|
| `seu-dominio.com.br` | `http://web:3000` |
| `api.seu-dominio.com.br` | `http://api:3001` |
| `media.seu-dominio.com.br` | `http://minio:9000` |

Copie somente o token gerado para `CLOUDFLARE_TUNNEL_TOKEN`. Não versionar o
arquivo `.env` nem o token.

## 4. Subir a aplicação

Execute a partir da raiz do repositório:

```bash
./scripts/production-preflight.sh
./scripts/production-up.sh
```

A primeira subida compila as imagens, migra o banco e baixa
`qwen3.5:0.8b`. Pode levar vários minutos. OpenAI, Anthropic e DeepSeek não são
removidos e continuam disponíveis no Hub. Com
`AI_PAID_FALLBACK_ENABLED=false`, o runtime não os chama automaticamente.

Na mesma máquina usada para desenvolvimento, `OLLAMA_VOLUME_NAME` mantém o
volume `repository_ollama_data`. Assim, a produção reutiliza o modelo já
baixado. Pare o Ollama de desenvolvimento antes da primeira subida para evitar
dois processos mantendo o mesmo modelo em memória:

```bash
docker compose --profile local-ai stop ollama
```

Acompanhe os logs:

```bash
docker compose logs -f
docker compose logs -f ollama-pull ollama
```

## 5. Verificar

```bash
docker compose ps                          # todos os serviços "Up"/"running"
curl -I https://seu-dominio.com.br         # HTTP 200
curl -I https://api.seu-dominio.com.br/health/ready
docker compose exec ollama ollama list
```

## 6. Acessar o admin

O painel admin está em `https://seu-dominio.com.br/admin`. Em produção ele exige
OIDC real; veja `docs/OIDC_CONFIGURATION.md`. Até a configuração do OIDC, o
acesso administrativo falha fechado sem impedir as páginas públicas.

## 7. Operação do dia a dia

```bash
docker compose logs -f worker            # ver o worker
docker compose restart api               # reiniciar a API após mudar .env
docker compose up -d --build             # após atualizar o código (git pull)
docker compose exec api npm run db:migrate -w @portal/api   # migração manual
```

## 8. Backup

Os dados ficam nos volumes nomeados. Backup simples com `pg_dump` + cópia do
MinIO:

```bash
# Banco
docker compose exec -T postgres pg_dump -U portal portal > backup.sql

# Mídia (volume do MinIO)
docker run --rm -v $(docker volume ls -q | grep minio_data):/data \
  -v $(pwd):/backup alpine tar czf /backup/media.tar.gz -C /data .
```

## 9. HTTPS / certificados

O Caddy emite e renova os certificados Let's Encrypt automaticamente. Só é
necessário que as portas 80/443 estejam abertas e o DNS correto.

---

### Observações

- **Oracle Cloud Always Free**: confira capacidade e limites atuais antes de
  provisionar. O modelo 0.8B é intencionalmente pequeno para CPU e pouca RAM.
- **Sem domínio?** O projeto exige HTTPS no endpoint de mídia, então um domínio
  (mesmo gratuito, ex.: `duckdns.org`) é necessário para produção. Com um
  subdomínio do duckdns, `SITE_DOMAIN=seuapp.duckdns.org`.
- **OIDC**: para login administrativo, configure as variáveis `OIDC_*` com um
  provedor (Auth0, Keycloak, Cognito, etc.) e deixe `DEV_ADMIN_TOKEN` vazio.
