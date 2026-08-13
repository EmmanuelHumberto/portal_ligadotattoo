#!/bin/sh
set -eu

: "${RELEASE_ID:?RELEASE_ID required}"
: "${BASE_URL:?BASE_URL required}"
: "${API_BASE_URL:?API_BASE_URL required}"
: "${DATABASE_URL:?DATABASE_URL for an isolated verification database required}"
: "${TEST_DATABASE_URL:?TEST_DATABASE_URL required}"
: "${TEST_OBJECT_STORAGE_ENDPOINT:?TEST_OBJECT_STORAGE_ENDPOINT required}"
: "${TEST_OBJECT_STORAGE_ACCESS_KEY:?TEST_OBJECT_STORAGE_ACCESS_KEY required}"
: "${TEST_OBJECT_STORAGE_SECRET_KEY:?TEST_OBJECT_STORAGE_SECRET_KEY required}"

case "$RELEASE_ID" in
 *[!A-Za-z0-9._-]*|'') echo "Invalid RELEASE_ID"; exit 1;;
esac
case "$BASE_URL:$API_BASE_URL" in
 https://*:https://*) ;;
 *) [ "${RC_ALLOW_HTTP:-false}" = "true" ] || {
   echo "Release candidate URLs must use HTTPS"; exit 1;
  };;
esac
[ "${NODE_ENV:-test}" != "production" ] || {
 echo "Release verification must use an isolated non-production test database"; exit 1;
}

EVIDENCE_DIR="${EVIDENCE_ROOT:-evidence}/$RELEASE_ID"
mkdir -p "$EVIDENCE_DIR"
GIT_SHA_VALUE="${GIT_SHA:-$(git rev-parse HEAD)}"
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

finish() {
 code=$?
 trap - EXIT
 if [ "$code" -eq 0 ]; then result=PASS; else result=FAIL; fi
 {
  echo "releaseId=$RELEASE_ID"
  echo "gitSha=$GIT_SHA_VALUE"
  echo "result=$result"
  echo "startedAt=$STARTED_AT"
  echo "completedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "baseUrl=$BASE_URL"
  echo "apiBaseUrl=$API_BASE_URL"
  echo "loadGate=${LOAD_GATE_RESULT:-NOT_STARTED}"
 } > "$EVIDENCE_DIR/verification-summary.txt"
 exit "$code"
}
trap finish EXIT

run_gate() {
 name=$1
 shift
 log="$EVIDENCE_DIR/$name.txt"
 echo "==> $name"
 if "$@" > "$log" 2>&1; then
  cat "$log"
 else
  code=$?
  cat "$log"
  return "$code"
 fi
}

if [ "${RC_SKIP_INSTALL:-false}" != "true" ]; then
 run_gate install npm ci
fi

run_gate migrations npm run db:migrate
run_gate verify-full npm run verify:full
run_gate dependency-audit npm audit --audit-level=critical
run_gate e2e env \
 PLAYWRIGHT_WEB_BASE_URL="$BASE_URL" \
 PLAYWRIGHT_API_BASE_URL="$API_BASE_URL" \
 PLAYWRIGHT_MANAGE_SERVERS=false \
 npm run test:e2e
run_gate smoke ./scripts/smoke.sh "$BASE_URL"

if command -v k6 >/dev/null 2>&1; then
 run_gate load env BASE_URL="$BASE_URL" k6 run test/performance/k6-public-smoke.js
 LOAD_GATE_RESULT=PASS
elif [ "${RC_REQUIRE_K6:-true}" = "true" ]; then
 LOAD_GATE_RESULT=FAIL
 echo "k6 unavailable - performance gate NOT EXECUTED" \
  > "$EVIDENCE_DIR/load.txt"
 cat "$EVIDENCE_DIR/load.txt"
 exit 1
else
 LOAD_GATE_RESULT=NOT_EXECUTED
 echo "k6 unavailable - performance gate explicitly not required" \
  > "$EVIDENCE_DIR/load.txt"
fi

echo "Release candidate verification passed: $EVIDENCE_DIR"
