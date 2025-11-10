#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL_SUFFIX=${EMAIL_SUFFIX:-$(date +%s)}

curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\n    \"name\": \"Usuário Teste\",\n    \"email\": \"usuario${EMAIL_SUFFIX}@example.com\",\n    \"password\": \"Senha@123\"\n  }"
