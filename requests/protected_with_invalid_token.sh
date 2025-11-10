#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}
TOKEN=${TOKEN:-token-invalido}

curl -i -X GET "$BASE_URL/protected" \
  -H "Authorization: Bearer ${TOKEN}"
