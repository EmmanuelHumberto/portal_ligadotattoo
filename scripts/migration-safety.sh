#!/bin/sh
set -eu
# Baseline static guard. Database-native migration verification remains authoritative.
FILES=$(find sql -type f -name '*.sql' | sort)
for f in $FILES; do
  if grep -Eiq 'drop[[:space:]]+(table|column)|alter[[:space:]].*type' "$f"; then
    echo "Potential destructive migration requires explicit expand/contract review: $f"
    exit 1
  fi
done
echo "Migration static safety check OK"
