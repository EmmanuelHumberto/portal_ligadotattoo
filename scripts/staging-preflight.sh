#!/bin/sh
set -eu
ENV_FILE="${1:-.env.staging}"
test -f "$ENV_FILE" || { echo "Missing $ENV_FILE"; exit 1; }

set -a
. "$ENV_FILE"
set +a

required="DATABASE_URL SESSION_SIGNING_SECRET ANALYTICS_HASH_SALT OBJECT_STORAGE_ENDPOINT OBJECT_STORAGE_BUCKET OBJECT_STORAGE_ACCESS_KEY OBJECT_STORAGE_SECRET_KEY RELEASE_ID WEB_IMAGE API_IMAGE WORKER_IMAGE"
for k in $required; do
 eval "v=\${$k:-}"
 [ -n "$v" ] || { echo "Missing required variable: $k"; exit 1; }
done

[ "${#SESSION_SIGNING_SECRET}" -ge 32 ] || {
 echo "SESSION_SIGNING_SECRET must be at least 32 characters"; exit 1;
}

case "${NEXT_PUBLIC_SITE_URL:-}" in
 https://*) ;;
 *) echo "NEXT_PUBLIC_SITE_URL must use HTTPS in staging"; exit 1 ;;
esac

echo "staging preflight OK"
