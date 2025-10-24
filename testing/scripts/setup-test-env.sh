#!/bin/bash
# Test Environment Setup Script
# Data Aggregator Platform Testing Framework

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Environment Setup${NC}"
echo -e "${BLUE}Data Aggregator Platform${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

source "${PROJECT_ROOT}/testing/config/test-config.sh"

echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: Docker is not installed${NC}"; exit 1; }
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

echo -e "${YELLOW}[2/7] Stopping existing test containers (if any)...${NC}"
cd "${PROJECT_ROOT}"
$DOCKER_COMPOSE -f docker-compose.test.yml down -v 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned up existing test containers${NC}"
echo ""

echo -e "${YELLOW}[3/7] Starting Docker Compose test environment...${NC}"
$DOCKER_COMPOSE -f docker-compose.test.yml up -d test-db test-redis
echo -e "${GREEN}✓ Test database and Redis started${NC}"
echo ""

echo -e "${YELLOW}[4/7] Waiting for services to be healthy...${NC}"
echo "Waiting for test database..."
for i in {1..30}; do
    if docker exec dataaggregator-test-db pg_isready -U test_user -d dataaggregator_test >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Test database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Test database failed to start${NC}"
        exit 1
    fi
    sleep 1
done

echo "Waiting for test Redis..."
for i in {1..30}; do
    if docker exec dataaggregator-test-redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Test Redis is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Test Redis failed to start${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

echo -e "${YELLOW}[5/7] Running database migrations...${NC}"
cd "${PROJECT_ROOT}/backend"
export DATABASE_URL="${TEST_DATABASE_URL}"
if [ -f "alembic.ini" ]; then
    python3 -m alembic upgrade head 2>&1 || echo -e "${YELLOW}Warning: Migrations not set up yet${NC}"
else
    echo -e "${YELLOW}Warning: Alembic not configured yet${NC}"
fi
echo ""

echo -e "${YELLOW}[6/7] Seeding test database with test users...${NC}"
cd "${PROJECT_ROOT}"
if [ -f "backend/scripts/seed_test_data.py" ]; then
    python3 backend/scripts/seed_test_data.py 2>&1 || echo -e "${YELLOW}Warning: Seeding failed${NC}"
else
    echo -e "${YELLOW}Warning: Seeding script not found${NC}"
fi
echo ""

echo -e "${YELLOW}[7/7] Test environment ready!${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Environment Information${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Test Database: ${BLUE}localhost:5433${NC}"
echo -e "Database Name: ${BLUE}dataaggregator_test${NC}"
echo -e "Database User: ${BLUE}test_user${NC}"
echo -e "Test Redis:    ${BLUE}localhost:6380${NC}"
echo ""
echo -e "${GREEN}Test Users Created:${NC}"
echo -e "  - admin@test.com      (AdminTest123!)"
echo -e "  - developer@test.com  (DevTest123!)"
echo -e "  - designer@test.com   (DesignerTest123!)"
echo -e "  - executor@test.com   (ExecutorTest123!)"
echo -e "  - viewer@test.com     (ViewerTest123!)"
echo -e "  - executive@test.com  (ExecutiveTest123!)"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Ready to run tests!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Run tests with: ${BLUE}./testing/scripts/run-tests.sh${NC}"
echo ""
