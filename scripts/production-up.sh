#!/bin/sh
set -eu

repository_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
"$repository_dir/scripts/production-preflight.sh"
cd "$repository_dir/infra/production"
docker compose up -d --build
docker compose ps

printf '\nPortal iniciado. A primeira carga do modelo local pode levar alguns minutos.\n'
printf 'Acompanhe com: cd %s && docker compose logs -f ollama-pull api worker web cloudflared\n' "$PWD"
