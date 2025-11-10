#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
TOKEN=${TOKEN:-}

if [[ -z "${TOKEN}" ]]; then
  echo "Defina a variável de ambiente TOKEN com um JWT válido antes de executar este script." >&2
  exit 1
fi

curl -i -X GET "$BASE_URL/protected" \
  -H "Authorization: Bearer ${TOKEN}"
