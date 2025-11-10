#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3333}

curl -i -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{}"
