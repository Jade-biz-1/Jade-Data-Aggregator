# Example: E-commerce orders unification (local demo)

This short tutorial uses the built-in example data and a helper script to create two file connectors (Shopify, WooCommerce), a unification pipeline, and trigger a run.

## Prerequisites

- Local stack running (prefer):
  - `bash scripts/dev-up.sh`
- Tools on your host: `curl` and `jq` (for the loader script)

## Steps

1. Start the platform

```bash
bash scripts/dev-up.sh
```

1. Load the example (creates connectors + pipeline and triggers execution)

```bash
bash scripts/load-example.sh
```

- The script logs in to the API at `http://localhost:8001/api/v1`
- Default local credentials: `admin` / `password`
- It creates two file connectors that reference example JSON files mounted into the backend:
  - `uploads/examples/ecommerce/shopify_orders.json`
  - `uploads/examples/ecommerce/woocommerce_orders.json`
- It then creates a pipeline named "E-commerce Orders Unification (Example)" and calls its execute endpoint.

1. Inspect results

- In the UI:
  - Connectors: `/connectors` → you should see the two example connectors
  - Pipelines: `/pipelines` → find "E-commerce Orders Unification (Example)"
  - Execute/History: open the pipeline to view details and runs (if supported in current build)
- On disk (backend container volume mapped to repo uploads/):
  - Unified output path (created by the example): `uploads/examples/ecommerce/unified_orders.json`

## Notes

- Base API URL (local): `http://localhost:8001/api/v1`
- If you changed credentials, export USERNAME/PASSWORD before running the loader:

  ```bash
  USERNAME=myuser PASSWORD=mypass bash scripts/load-example.sh
  ```

- If `jq` is not installed on your host, install it or adapt the script to parse JSON with another tool.
