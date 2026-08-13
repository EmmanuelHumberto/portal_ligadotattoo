#!/bin/sh
set -eu
ENV_FILE="${1:-.env.staging}"
./scripts/staging-preflight.sh "$ENV_FILE"

docker compose --env-file "$ENV_FILE" -f infra/staging/compose.yml pull
docker compose --env-file "$ENV_FILE" -f infra/staging/compose.yml up migrate
docker compose --env-file "$ENV_FILE" -f infra/staging/compose.yml up bootstrap
docker compose --env-file "$ENV_FILE" -f infra/staging/compose.yml up -d api worker web
echo "staging workloads deployed"
