#!/bin/sh
set -eu
BASE="${1:?staging base URL required}"
case "$BASE" in https://*) ;; *) echo "HTTPS staging URL required"; exit 1;; esac

for path in / /maquinas /robots.txt /sitemap.xml /api/health; do
 code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$path")
 case "$code" in 2*|3*) echo "OK $code $path";; *)
  echo "FAIL $code $path"; exit 1;;
 esac
done
echo "staging public smoke OK"
