#!/usr/bin/env bash
set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "[dev-up] Docker daemon is not reachable. Start or restart Docker Desktop and try again." >&2
  exit 1
fi

echo "[dev-up] Building containers..."
docker compose build

echo "[dev-up] Starting containers..."
docker compose up -d

echo "[dev-up] Waiting for backend to be healthy on http://localhost:8001/health ..."
ATTEMPTS=0
until curl -sSf http://localhost:8001/health >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ "$ATTEMPTS" -gt 60 ]; then
    echo "[dev-up] Backend did not become healthy in time." >&2
    docker compose logs backend | tail -n 100 || true
    exit 1
  fi
  sleep 2
done

echo "[dev-up] Backend is healthy. Admin user should be available (admin/admin123!)."
FRONTEND_PORT_VALUE="${FRONTEND_PORT:-3000}"
echo "[dev-up] Frontend: http://localhost:${FRONTEND_PORT_VALUE}  |  API Docs: http://localhost:8001/docs"
