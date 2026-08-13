#!/bin/sh
set -eu

pids=''
stop() {
 trap - EXIT INT TERM
 [ -z "$pids" ] || kill $pids 2>/dev/null || true
 wait $pids 2>/dev/null || true
}
trap stop EXIT INT TERM

npm run dev -w @portal/api &
pids="$pids $!"
npm run dev -w @portal/worker &
pids="$pids $!"
npm run dev -w @portal/web &
pids="$pids $!"

echo "Portal Tattoo: http://localhost:3000"
echo "API: http://localhost:${PORT_API:-3001}/health/live"
wait
