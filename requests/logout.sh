#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
REFRESH_TOKEN=${REFRESH_TOKEN:-}

if [[ -z "$REFRESH_TOKEN" ]]; then
  echo "Informe o refresh token via variável REFRESH_TOKEN" >&2
  exit 1
fi

PAYLOAD=$(cat <<JSON
{
  "refreshToken": "${REFRESH_TOKEN}"
}
JSON
)

curl -i -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
