#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL=${EMAIL:-usuario@example.com}

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\n    \"name\": \"Usuário Duplicado\",\n    \"email\": \"${EMAIL}\",\n    \"password\": \"Senha@123\"\n  }"
