# Deploy em VM própria (Docker Compose + Caddy)

Guia para hospedar o **Portal Ligado Tattoo** numa VM Linux usando Docker
Compose e Caddy (HTTPS automático). Recomendado: **Oracle Cloud Always Free**
(VM ARM gratuita com 4 OCPUs / 24 GB RAM), ou qualquer VPS com Docker.

## Visão geral

```
Internet
   │
   ├─ https://seu-dominio.com.br      → Caddy → web  (Next.js, :3000)
   ├─ https://api.seu-dominio.com.br  → Caddy → api  (NestJS, :3001)
   └─ https://media.seu-dominio.com.br → Caddy → minio (S3, :9000)

Rede docker interna: postgres + redis + api + worker + web + minio
```

## Pré-requisitos

- Uma VM Linux (Ubuntu/Debian/Arm), com **Docker** e **Docker Compose v2**.
- Um **domínio** (ex.: `seu-dominio.com.br`) com DNS apontando para o IP da VM.
- As **portas 80 e 443** liberadas no firewall/security list da VM.

## 1. Preparar a VM

```bash
# Instalar Docker + Compose (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # depois saia e entre de novo no shell
```

Crie os registros DNS apontando para o IP da VM:

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
- `DEV_ADMIN_TOKEN` → gere com `openssl rand -hex 32` (será seu token de acesso ao admin).
- `OBJECT_STORAGE_ACCESS_KEY` / `OBJECT_STORAGE_SECRET_KEY` → credenciais do MinIO.
- `DEEPSEEK_API_KEY` → sua chave de IA (necessária para os rascunhos automáticos).

## 4. Subir a aplicação

```bash
docker compose up -d --build
```

A primeira subida compila as imagens (API, Web, Worker) e roda as migrações
e o bootstrap do banco automaticamente. Pode levar alguns minutos.

Acompanhe os logs:

```bash
docker compose logs -f
```

## 5. Verificar

```bash
docker compose ps                          # todos os serviços "Up"/"running"
curl -I https://seu-dominio.com.br         # HTTP 200
curl -I https://api.seu-dominio.com.br/health/ready
```

## 6. Acessar o admin

O painel admin está em `https://seu-dominio.com.br/admin`. Como não há OIDC
configurado, o acesso usa o token estático:

- Entre em qualquer rota `/admin/...`.
- Envie o header `Authorization: Bearer <DEV_ADMIN_TOKEN>`.

(O jeito mais prático de começar é usar o token via um cliente HTTP ou
configurar o OIDC depois — veja as variáveis `OIDC_*` no `.env`.)

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

- **Oracle Cloud Always Free**: na hora de criar a VM, escolha shape **ARM
  (Ampere A1)**, imagem Ubuntu, e libere as portas 80/443 no **Ingress** da
  subnet/security list.
- **Sem domínio?** O projeto exige HTTPS no endpoint de mídia, então um domínio
  (mesmo gratuito, ex.: `duckdns.org`) é necessário para produção. Com um
  subdomínio do duckdns, `SITE_DOMAIN=seuapp.duckdns.org`.
- **OIDC**: para login real de usuários, configure as variáveis `OIDC_*` com um
  provedor (Auth0, Keycloak, Cognito, etc.) e deixe `DEV_ADMIN_TOKEN` vazio.
