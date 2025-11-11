#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL=${EMAIL:-usuario@example.com}
BIRTH_DATE=${BIRTH_DATE:-1990-01-01}

PAYLOAD=$(cat <<JSON
{
  "name": "Usuário Duplicado",
  "email": "${EMAIL}",
  "password": "Senha@123",
  "confirmPassword": "Senha@123",
  "birthDate": "${BIRTH_DATE}"
}
JSON
)

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
