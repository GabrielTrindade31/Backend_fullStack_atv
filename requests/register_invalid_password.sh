#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL_SUFFIX=${EMAIL_SUFFIX:-$(date +%s)}
BIRTH_DATE=${BIRTH_DATE:-1990-01-01}

PAYLOAD=$(cat <<JSON
{
  "name": "Usuário Senha Fraca",
  "email": "senha-fraca${EMAIL_SUFFIX}@example.com",
  "password": "123456",
  "confirmPassword": "123456",
  "birthDate": "${BIRTH_DATE}"
}
JSON
)

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
