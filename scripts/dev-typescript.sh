#!/bin/sh
set -eu

npx tsc -p tsconfig.json
pids=''
stop() {
 trap - EXIT INT TERM
 [ -z "$pids" ] || kill $pids 2>/dev/null || true
 wait $pids 2>/dev/null || true
}
trap stop EXIT INT TERM

npx tsc -p tsconfig.json --watch --preserveWatchOutput &
pids="$pids $!"
node --watch dist/main.js &
pids="$pids $!"
wait
