#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
BIRTH_DATE=${BIRTH_DATE:-1990-01-01}

PAYLOAD=$(cat <<JSON
{
  "name": "Usuário Email Inválido",
  "email": "email-invalido",
  "password": "Senha@123",
  "confirmPassword": "Senha@123",
  "birthDate": "${BIRTH_DATE}"
}
JSON
)

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
