#!/bin/sh
set -eu

repository_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

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
node --env-file-if-exists="$repository_dir/.env" --watch dist/main.js &
pids="$pids $!"
wait
