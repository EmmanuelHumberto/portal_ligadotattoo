#!/bin/sh
set -eu

repository_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
production_dir="$repository_dir/infra/production"
env_file="$production_dir/.env"

fail() { printf 'ERRO: %s\n' "$1" >&2; exit 1; }
read_env() {
  awk -F= -v key="$1" '$1==key {sub(/^[^=]*=/,""); print; exit}' "$env_file"
}
require_real_value() {
  value=$(read_env "$1")
  [ -n "$value" ] || fail "$1 não está configurado"
  case "$value" in
    troque-*|cole-*|seu-dominio*) fail "$1 ainda contém o valor de exemplo" ;;
  esac
}

command -v docker >/dev/null 2>&1 || fail 'Docker não está instalado'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 não está disponível'
[ -f "$env_file" ] || fail 'copie infra/production/.env.example para infra/production/.env'

require_real_value SITE_DOMAIN
require_real_value POSTGRES_PASSWORD
require_real_value INTERNAL_API_KEY
require_real_value SESSION_SIGNING_SECRET
require_real_value RATE_LIMIT_HASH_SALT
require_real_value ANALYTICS_HASH_SALT
require_real_value OBJECT_STORAGE_ACCESS_KEY
require_real_value OBJECT_STORAGE_SECRET_KEY

profiles=$(read_env COMPOSE_PROFILES)
case ",$profiles," in
  *,tunnel,*) require_real_value CLOUDFLARE_TUNNEL_TOKEN ;;
  *,direct,*) : ;;
  *) fail 'COMPOSE_PROFILES deve conter tunnel ou direct' ;;
esac

case ",$profiles," in
  *,local-ai,*)
    [ "$(read_env OLLAMA_BASE_URL)" = 'http://ollama:11434' ] ||
      fail 'OLLAMA_BASE_URL deve ser http://ollama:11434 no Compose de produção'
    ;;
esac

[ -z "$(read_env DEV_ADMIN_TOKEN)" ] ||
  fail 'DEV_ADMIN_TOKEN deve permanecer vazio em produção; configure OIDC'

available_kb=$(df -Pk "$production_dir" | awk 'NR==2 {print $4}')
minimum_kb=10485760
minimum_label='10 GB'
case ",$profiles," in
  *,local-ai,*)
    minimum_kb=20971520
    minimum_label='20 GB'
    ;;
esac
[ "$available_kb" -ge "$minimum_kb" ] ||
  fail "menos de $minimum_label livres; libere espaço antes de construir e baixar o modelo"

(cd "$production_dir" && docker compose config --quiet)
printf 'Preflight aprovado: perfil=%s, espaço livre=%s GB.\n' \
  "$profiles" "$((available_kb/1024/1024))"
