#!/bin/sh
set -eu
BASE="${1:?base url required}"
curl -fsS "$BASE/" >/dev/null
curl -fsS "$BASE/maquinas" >/dev/null
curl -fsS "$BASE/robots.txt" >/dev/null
curl -fsS "$BASE/sitemap.xml" >/dev/null
curl -fsS "$BASE/api/health" >/dev/null
echo "Public smoke OK"
