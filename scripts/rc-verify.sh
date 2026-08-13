#!/bin/sh
set -eu

: "${BASE_URL:?BASE_URL required}"
: "${RELEASE_ID:?RELEASE_ID required}"

mkdir -p evidence/"$RELEASE_ID"

npm ci
npm run lint | tee evidence/"$RELEASE_ID"/lint.txt
npm run typecheck | tee evidence/"$RELEASE_ID"/typecheck.txt
npm test -- --runInBand | tee evidence/"$RELEASE_ID"/unit.txt
npm run test:contracts | tee evidence/"$RELEASE_ID"/contracts.txt
npm run db:migrate:verify | tee evidence/"$RELEASE_ID"/migrations.txt

npx playwright test | tee evidence/"$RELEASE_ID"/e2e.txt
./scripts/smoke.sh "$BASE_URL" | tee evidence/"$RELEASE_ID"/smoke.txt

if command -v k6 >/dev/null 2>&1; then
 BASE_URL="$BASE_URL" k6 run test/performance/k6-public-smoke.js   | tee evidence/"$RELEASE_ID"/load.txt
else
 echo "k6 unavailable - performance gate NOT EXECUTED"   | tee evidence/"$RELEASE_ID"/load.txt
fi

echo "RC verification execution completed; evaluate gate status before GO."
