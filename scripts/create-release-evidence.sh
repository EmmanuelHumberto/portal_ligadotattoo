#!/bin/sh
set -eu
: "${RELEASE_ID:?}"
DIR="evidence/$RELEASE_ID"
mkdir -p "$DIR"
cat > "$DIR/distribution.json" <<EOF
{
 "releaseId":"$RELEASE_ID",
 "webImage":"${WEB_IMAGE:?}",
 "apiImage":"${API_IMAGE:?}",
 "workerImage":"${WORKER_IMAGE:?}",
 "environment":"staging",
 "createdAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
echo "$DIR"
