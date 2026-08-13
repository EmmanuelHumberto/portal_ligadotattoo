#!/bin/sh
set -eu
if grep -R -E 'NEXT_PUBLIC_(OPENAI|ANTHROPIC|DEEPSEEK|.*SECRET|.*TOKEN|.*KEY)' \
 --exclude-dir=node_modules --exclude-dir=.git --exclude='.env.example' \
 --exclude='check-secrets.sh' .; then
 echo "Potential browser-exposed secret variable"; exit 1
fi
echo "secret boundary static check OK"
