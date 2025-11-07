#!/usr/bin/env bash
set -euo pipefail

API_BASE="http://localhost:8001/api/v1"
USERNAME="${USERNAME:-admin}"
PASSWORD="${PASSWORD:-password}"

echo "[load-example] Logging in as $USERNAME ..."
TOKEN=$(curl -sS -X POST "$API_BASE/auth/login" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "username=$USERNAME&password=$PASSWORD" | jq -r .access_token)

if [ -z "${TOKEN:-}" ] || [ "$TOKEN" = "null" ]; then
  echo "[load-example] Failed to obtain access token. Check credentials and backend." >&2
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"

echo "[load-example] Creating example connectors..."
SHOPIFY_ID=$(curl -sS -X POST "$API_BASE/connectors" -H "$AUTH" -H 'Content-Type: application/json' -d @- <<'JSON' | jq -r .id
{
  "name": "Shopify Orders (Example)",
  "connector_type": "file",
  "config": {
    "path": "/app/uploads/examples/ecommerce/shopify_orders.json",
    "format": "json"
  },
  "is_active": true
}
JSON
)

WOOC_ID=$(curl -sS -X POST "$API_BASE/connectors" -H "$AUTH" -H 'Content-Type: application/json' -d @- <<'JSON' | jq -r .id
{
  "name": "WooCommerce Orders (Example)",
  "connector_type": "file",
  "config": {
    "path": "/app/uploads/examples/ecommerce/woocommerce_orders.json",
    "format": "json"
  },
  "is_active": true
}
JSON
)

echo "[load-example] Shopify connector id: $SHOPIFY_ID, WooCommerce connector id: $WOOC_ID"

echo "[load-example] Creating example pipeline..."
PIPELINE_ID=$(curl -sS -X POST "$API_BASE/pipelines" -H "$AUTH" -H 'Content-Type: application/json' -d @- <<JSON | jq -r .id
{
  "name": "E-commerce Orders Unification (Example)",
  "description": "Unify Shopify and WooCommerce orders into a common format.",
  "source_config": {
    "type": "multi-file",
    "sources": [
      {"connector_id": $SHOPIFY_ID, "platform": "shopify"},
      {"connector_id": $WOOC_ID, "platform": "woocommerce"}
    ]
  },
  "destination_config": {
    "type": "file",
    "path": "/app/uploads/examples/ecommerce/unified_orders.json",
    "format": "jsonl"
  },
  "transformation_config": {
    "type": "mapping",
    "rules": [
      {"platform": "shopify", "mappings": [
        {"source": "email", "destination": "customer_email"},
        {"source": "created_at", "destination": "order_date"},
        {"source": "total_price", "destination": "order_value"}
      ]},
      {"platform": "woocommerce", "mappings": [
        {"source": "billing.email", "destination": "customer_email"},
        {"source": "date_created", "destination": "order_date"},
        {"source": "total", "destination": "order_value"}
      ]}
    ],
    "post": [
      {"op": "lowercase", "field": "customer_email"}
    ]
  },
  "schedule": null,
  "is_active": true
}
JSON
)

echo "[load-example] Pipeline id: $PIPELINE_ID"

echo "[load-example] Triggering example pipeline execution (if supported)..."
curl -sS -X POST "$API_BASE/pipelines/$PIPELINE_ID/execute" -H "$AUTH" -H 'Content-Type: application/json' -d '{"triggered_by":"example-script"}' || true

echo "[load-example] Done. Check /uploads/examples/ecommerce inside the repo (mounted to /app/uploads in backend)."
