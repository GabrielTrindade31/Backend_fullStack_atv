#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}

curl -i -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\n    \"email\": \"email-invalido\",\n    \"password\": \"Senha@123\"\n  }"
