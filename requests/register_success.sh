#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL_SUFFIX=${EMAIL_SUFFIX:-$(date +%s)}
BIRTH_DATE=${BIRTH_DATE:-1990-01-01}

PAYLOAD=$(cat <<JSON
{
  "name": "Usuário Teste",
  "email": "usuario${EMAIL_SUFFIX}@example.com",
  "password": "Senha@123",
  "confirmPassword": "Senha@123",
  "birthDate": "${BIRTH_DATE}"
}
JSON
)

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
