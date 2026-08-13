#!/bin/sh
set -eu
MANIFEST="${1:?previous release env/manifest required}"
test -f "$MANIFEST" || exit 1
set -a; . "$MANIFEST"; set +a

echo "Rolling back application artifacts to release ${RELEASE_ID:?}"
# Schema is intentionally not reverse-migrated here.
docker compose --env-file "$MANIFEST" -f infra/staging/compose.yml up -d api worker web
echo "application rollback requested; execute smoke verification"
