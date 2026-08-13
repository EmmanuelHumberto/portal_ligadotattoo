#!/bin/sh
set -eu
OUT="${1:-release-candidate.json}"
cat > "$OUT" <<EOF
{
  "releaseId":"${RELEASE_ID:?}",
  "gitSha":"${GIT_SHA:?}",
  "webImage":"${WEB_IMAGE:?}",
  "apiImage":"${API_IMAGE:?}",
  "workerImage":"${WORKER_IMAGE:?}",
  "environment":"${ENVIRONMENT:-staging}",
  "verificationStartedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "decision":"PENDING"
}
EOF
echo "$OUT"
