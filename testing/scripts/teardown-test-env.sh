#!/bin/bash
# Test Environment Teardown Script
# Data Aggregator Platform Testing Framework

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${YELLOW}Tearing down test environment...${NC}"

cd "${PROJECT_ROOT}"

# Stop and remove test containers
docker compose -f docker compose.test.yml down -v

echo -e "${GREEN}✓ Test environment cleaned up${NC}"
