#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
EMAIL=${EMAIL:-usuario@example.com}
PASSWORD=${PASSWORD:-Senha@123}

curl -i -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\n    \"email\": \"${EMAIL}\",\n    \"password\": \"${PASSWORD}\"\n  }"
