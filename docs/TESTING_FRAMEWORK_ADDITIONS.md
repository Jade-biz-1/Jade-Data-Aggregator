# Testing Framework Additions
**To be inserted into AUTOMATED_TEST_SUITE_PLAN.md after line 673**

---

## Test Execution Framework

### Overview

The test execution framework provides a unified, automated approach to running all tests across the Data Aggregator Platform. It orchestrates backend, frontend, E2E, performance, and security tests in a structured, dependency-based sequence.

### Key Principles

1. **Single Entry Point**: One command (`./run-tests.sh`) to run the entire test suite
2. **Dependency-Based Execution**: Tests run in logical order respecting dependencies
3. **Stage-Level Fail-Fast**: Complete each stage, stop between stages on failure
4. **Environment Awareness**: Automatically detects local vs CI/CD execution
5. **Isolated Test Environment**: Docker Compose orchestrates ephemeral test infrastructure
6. **Comprehensive Reporting**: Multi-format output (console, HTML, JSON, XML)

### Test Execution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Test Execution Driver                        │
│                      (./run-tests.sh)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │   Environment Detection        │
            │   (CI vs Local)                │
            └───────────────┬───────────────┘
                            │
            ┌───────────────┴───────────────┐
            │   Environment Setup            │
            │   (Docker Compose)             │
            └───────────────┬───────────────┘
                            │
     ┌──────────────────────┴──────────────────────┐
     │          Test Execution Stages              │
     │         (Dependency-Based Order)            │
     └──────────────────────┬──────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  │  Stage 1  │      │  Stage 2  │      │  Stage 3  │
  │  Backend  │─────▶│  Backend  │─────▶│ Frontend  │
  │   Unit    │      │Integration│      │   Unit    │
  └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
        │                   │                   │
   [Models ▶ Services ▶ Endpoints ▶ Core]     │
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  │  Stage 4  │      │  Stage 5  │      │  Stage 6  │
  │ Frontend  │─────▶│    E2E    │─────▶│Performance│
  │Integration│      │   Tests   │      │   Tests   │
  └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                      ┌─────▼─────┐
                      │  Stage 7  │
                      │  Security │
                      │   Tests   │
                      └─────┬─────┘
                            │
            ┌───────────────┴───────────────┐
            │   Report Generation            │
            │   (HTML, JSON, XML)            │
            └───────────────┬───────────────┘
                            │
            ┌───────────────┴───────────────┐
            │   Environment Teardown         │
            │   (Docker Compose Down)        │
            └───────────────────────────────┘
```

### Test Execution Order

**Stage-Based Execution with Fail-Fast Between Stages**:

```bash
Stage 1: Backend Unit Tests
  ├─ 1.1: Backend Models (test_user_model.py, test_pipeline_model.py, ...)
  ├─ 1.2: Backend Services (test_pipeline_service.py, test_connector_service.py, ...)
  ├─ 1.3: Backend Endpoints (test_pipeline_endpoints.py, test_connector_endpoints.py, ...)
  └─ 1.4: Backend Core Utilities (test_security.py, test_database.py, ...)

  ✓ All tests in stage complete → Proceed to Stage 2
  ✗ Any tests fail → Report failures, STOP (do not proceed to Stage 2)

Stage 2: Backend Integration Tests
  ├─ 2.1: CRUD Operations (test_pipeline_crud.py, test_connector_crud.py, ...)
  ├─ 2.2: Database Operations (test_database_operations.py)
  ├─ 2.3: API Integration (test_analytics_integration.py, ...)
  └─ 2.4: WebSocket Integration (test_websocket_integration.py)

  ✓ All tests in stage complete → Proceed to Stage 3
  ✗ Any tests fail → Report failures, STOP

Stage 3: Frontend Unit Tests
  ├─ 3.1: Components (ThemeToggle.test.tsx, Button.test.tsx, ...)
  ├─ 3.2: Hooks (usePermissions.test.ts, useAuth.test.ts, ...)
  ├─ 3.3: Pages (Dashboard.test.tsx, Pipelines.test.tsx, ...)
  └─ 3.4: Utilities (api.test.ts, utils.test.ts)

  ✓ All tests in stage complete → Proceed to Stage 4
  ✗ Any tests fail → Report failures, STOP

Stage 4: Frontend Integration Tests
  ├─ 4.1: API Integration (api-integration.spec.ts)
  ├─ 4.2: Form Submission (form-submission.spec.ts)
  └─ 4.3: Navigation (navigation.spec.ts)

  ✓ All tests in stage complete → Proceed to Stage 5
  ✗ Any tests fail → Report failures, STOP

Stage 5: End-to-End Tests
  ├─ 5.1: Authentication (auth.spec.ts)
  ├─ 5.2: RBAC (rbac.spec.ts)
  ├─ 5.3: User Journeys (user-journeys.spec.ts, pipelines.spec.ts, ...)
  └─ 5.4: Accessibility (accessibility.spec.ts)

  ✓ All tests in stage complete → Proceed to Stage 6
  ✗ Any tests fail → Report failures, STOP

Stage 6: Performance Tests
  ├─ 6.1: Backend Performance (test_api_performance.py, test_database_performance.py)
  ├─ 6.2: Frontend Performance (page-load.spec.ts, rendering.spec.ts)
  └─ 6.3: Load Tests (locustfile.py)

  ✓ All tests in stage complete → Proceed to Stage 7
  ✗ Any tests fail → Report failures, STOP

Stage 7: Security Tests
  ├─ 7.1: OWASP Top 10 (test_sql_injection.py, test_xss.py, ...)
  ├─ 7.2: Authentication Security (test_authentication.py)
  └─ 7.3: Dependency Scanning (bandit, safety, npm audit)

  ✓ All tests in stage complete → Generate final report
  ✗ Any tests fail → Report failures, STOP
```

### Main Test Runner Script

**File**: `testing/scripts/run-tests.sh`

```bash
#!/bin/bash
#
# Unified Test Execution Driver
# Data Aggregator Platform - Automated Test Suite
#
# Usage:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh --stage 1          # Run specific stage only
#   ./run-tests.sh --no-fail-fast     # Continue on errors
#   ./run-tests.sh --capture-all      # Max artifact capture
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TESTING_DIR="$PROJECT_ROOT/testing"
REPORTS_DIR="$TESTING_DIR/reports"

# Load configuration
source "$TESTING_DIR/config/test-config.sh"

# Detect environment
if [ "${CI:-false}" = "true" ]; then
    ENV_TYPE="ci"
    echo -e "${BLUE}[INFO]${NC} Running in CI/CD environment"
else
    ENV_TYPE="local"
    echo -e "${BLUE}[INFO]${NC} Running in local environment"
fi

# Parse command-line arguments
STAGE_TO_RUN=""
FAIL_FAST=true
CAPTURE_LEVEL="${CAPTURE_LEVEL:-essential}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --stage)
            STAGE_TO_RUN="$2"
            shift 2
            ;;
        --no-fail-fast)
            FAIL_FAST=false
            shift
            ;;
        --capture-all)
            CAPTURE_LEVEL="comprehensive"
            shift
            ;;
        --capture-minimal)
            CAPTURE_LEVEL="minimal"
            shift
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Function: Setup test environment
setup_environment() {
    echo -e "${BLUE}[SETUP]${NC} Initializing test environment..."

    # Create reports directory
    mkdir -p "$REPORTS_DIR"/{coverage,test-results,screenshots,videos,logs}

    # Start Docker Compose test environment
    echo -e "${BLUE}[SETUP]${NC} Starting Docker Compose services..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" up -d --build

    # Wait for services to be ready
    echo -e "${BLUE}[SETUP]${NC} Waiting for services to be ready..."
    sleep 10

    # Verify PostgreSQL is ready
    until docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" exec -T test-db pg_isready; do
        echo -e "${YELLOW}[WAIT]${NC} Waiting for PostgreSQL..."
        sleep 2
    done

    # Run database migrations
    echo -e "${BLUE}[SETUP]${NC} Running database migrations..."
    cd "$PROJECT_ROOT/backend"
    poetry run alembic upgrade head

    # Seed test data
    echo -e "${BLUE}[SETUP]${NC} Seeding test database..."
    poetry run python scripts/seed_test_data.py

    echo -e "${GREEN}[SETUP]${NC} Test environment ready!"
}

# Function: Teardown test environment
teardown_environment() {
    echo -e "${BLUE}[TEARDOWN]${NC} Cleaning up test environment..."

    # Stop Docker Compose services
    docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" down -v

    echo -e "${GREEN}[TEARDOWN]${NC} Test environment cleaned up!"
}

# Function: Run a test stage
run_stage() {
    local stage_num=$1
    local stage_name=$2
    local test_command=$3

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Stage $stage_num: $stage_name${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Run the test command
    if eval "$test_command"; then
        echo -e "${GREEN}[PASS]${NC} Stage $stage_num: $stage_name"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} Stage $stage_num: $stage_name"
        return 1
    fi
}

# Function: Generate test reports
generate_reports() {
    echo -e "${BLUE}[REPORT]${NC} Generating test reports..."

    # Combine coverage reports
    echo -e "${BLUE}[REPORT]${NC} Combining coverage data..."

    # Backend coverage
    cd "$PROJECT_ROOT/backend"
    poetry run coverage combine
    poetry run coverage html -d "$REPORTS_DIR/coverage/backend"
    poetry run coverage json -o "$REPORTS_DIR/coverage/backend/coverage.json"

    # Frontend coverage
    cd "$PROJECT_ROOT/frontend"
    npm run test:unit:coverage
    cp -r coverage/* "$REPORTS_DIR/coverage/frontend/"

    # Generate summary report
    python3 "$TESTING_DIR/scripts/generate_summary.py" > "$REPORTS_DIR/test-summary.txt"

    echo -e "${GREEN}[REPORT]${NC} Reports generated at: $REPORTS_DIR"
}

# Main execution
main() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Data Aggregator Test Suite          ║${NC}"
    echo -e "${BLUE}║   Unified Test Runner                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    # Setup environment
    setup_environment

    # Track overall success
    overall_success=true

    # Stage 1: Backend Unit Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "1" ]; then
        if ! run_stage 1 "Backend Unit Tests" \
            "cd $PROJECT_ROOT/backend && poetry run pytest testing/backend-tests/unit -v --cov=backend --cov-report=html"; then
            overall_success=false
            if [ "$FAIL_FAST" = true ]; then
                echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 1 failures"
                teardown_environment
                exit 1
            fi
        fi
    fi

    # Stage 2: Backend Integration Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "2" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 2 "Backend Integration Tests" \
                "cd $PROJECT_ROOT/backend && poetry run pytest testing/backend-tests/integration -v --cov=backend --cov-append"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 2 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 2: Backend Integration Tests (previous stage failed)"
        fi
    fi

    # Stage 3: Frontend Unit Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "3" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 3 "Frontend Unit Tests" \
                "cd $PROJECT_ROOT/frontend && npm run test:unit"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 3 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 3: Frontend Unit Tests (previous stage failed)"
        fi
    fi

    # Stage 4: Frontend Integration Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "4" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 4 "Frontend Integration Tests" \
                "cd $PROJECT_ROOT/frontend && npm run test:integration"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 4 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 4: Frontend Integration Tests (previous stage failed)"
        fi
    fi

    # Stage 5: E2E Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "5" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 5 "End-to-End Tests" \
                "cd $PROJECT_ROOT/frontend && npm run test"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 5 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 5: E2E Tests (previous stage failed)"
        fi
    fi

    # Stage 6: Performance Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "6" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 6 "Performance Tests" \
                "cd $PROJECT_ROOT/backend && poetry run pytest testing/backend-tests/performance -v"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 6 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 6: Performance Tests (previous stage failed)"
        fi
    fi

    # Stage 7: Security Tests
    if [ -z "$STAGE_TO_RUN" ] || [ "$STAGE_TO_RUN" = "7" ]; then
        if [ "$overall_success" = true ] || [ "$FAIL_FAST" = false ]; then
            if ! run_stage 7 "Security Tests" \
                "cd $PROJECT_ROOT/backend && poetry run pytest testing/backend-tests/security -v && poetry run bandit -r backend/ && poetry run safety check"; then
                overall_success=false
                if [ "$FAIL_FAST" = true ]; then
                    echo -e "${RED}[FAIL-FAST]${NC} Stopping due to Stage 7 failures"
                    teardown_environment
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}[SKIP]${NC} Stage 7: Security Tests (previous stage failed)"
        fi
    fi

    # Generate reports
    generate_reports

    # Teardown environment
    teardown_environment

    # Final summary
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Test Execution Complete${NC}"
    echo -e "${BLUE}========================================${NC}"

    if [ "$overall_success" = true ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo -e "${GREEN}Reports available at: $REPORTS_DIR${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        echo -e "${YELLOW}Check reports at: $REPORTS_DIR${NC}"
        exit 1
    fi
}

# Run main function
main
```

### Test Configuration

**File**: `testing/config/test-config.sh`

```bash
#!/bin/bash
#
# Test Configuration
# Centralized configuration for test execution
#

# Failure artifact capture level (minimal, essential, comprehensive)
export CAPTURE_LEVEL="${CAPTURE_LEVEL:-essential}"

# Test timeouts
export UNIT_TEST_TIMEOUT=10        # seconds
export INTEGRATION_TEST_TIMEOUT=30 # seconds
export E2E_TEST_TIMEOUT=60        # seconds

# Parallel execution
export PYTEST_WORKERS=4            # Backend parallel workers
export JEST_WORKERS="50%"          # Frontend parallel workers (% of CPU)
export PLAYWRIGHT_WORKERS=2        # E2E parallel workers

# Coverage thresholds
export BACKEND_COVERAGE_THRESHOLD=80
export FRONTEND_COVERAGE_THRESHOLD=80

# Report retention
export MAX_REPORT_RUNS=10
export MAX_REPORT_DAYS=30
export MAX_REPORT_SIZE_MB=5000

# Artifact capture settings
case $CAPTURE_LEVEL in
    minimal)
        export CAPTURE_STACK_TRACES=true
        export CAPTURE_HTML_REPORTS=true
        export CAPTURE_SCREENSHOTS=false
        export CAPTURE_VIDEOS=false
        export CAPTURE_DB_DUMPS=false
        export CAPTURE_API_LOGS=false
        export CAPTURE_APP_LOGS=false
        export CAPTURE_BROWSER_LOGS=false
        ;;
    essential)
        export CAPTURE_STACK_TRACES=true
        export CAPTURE_HTML_REPORTS=true
        export CAPTURE_SCREENSHOTS=true   # E2E only
        export CAPTURE_VIDEOS=false
        export CAPTURE_DB_DUMPS=false
        export CAPTURE_API_LOGS=true
        export CAPTURE_APP_LOGS=true
        export CAPTURE_BROWSER_LOGS=false
        ;;
    comprehensive)
        export CAPTURE_STACK_TRACES=true
        export CAPTURE_HTML_REPORTS=true
        export CAPTURE_SCREENSHOTS=true
        export CAPTURE_VIDEOS=true
        export CAPTURE_DB_DUMPS=true
        export CAPTURE_API_LOGS=true
        export CAPTURE_APP_LOGS=true
        export CAPTURE_BROWSER_LOGS=true
        ;;
esac
```

**File**: `testing/config/test-config.yml`

```yaml
# Test Configuration
# YAML configuration for test execution preferences

failure_artifacts:
  # Options: minimal, essential, comprehensive
  level: essential

  capture:
    stack_traces: true
    html_reports: true
    screenshots: true      # E2E only
    videos: false         # E2E only, expensive
    database_dumps: false # Large files, enable for debugging
    api_logs: true
    app_logs: true
    browser_logs: false   # E2E only

  retention:
    max_runs: 10         # Keep last 10 test runs
    max_days: 30         # Or 30 days, whichever comes first
    max_size_mb: 5000    # Auto-cleanup if reports exceed 5GB

test_execution:
  fail_fast: true        # Stop between stages on failure
  parallel_execution: true

  workers:
    backend_unit: 4
    frontend_unit: "50%"  # 50% of available CPUs
    e2e: 2

  timeouts:
    unit_test: 10        # seconds
    integration_test: 30
    e2e_test: 60

coverage_thresholds:
  backend:
    overall: 80
    models: 90
    services: 85
    endpoints: 90

  frontend:
    overall: 80
    components: 75
    hooks: 85
    pages: 75

reporting:
  formats:
    - console
    - html
    - json
    - xml           # For CI/CD

  console:
    colors: true
    verbose: true
    show_progress: true

  html:
    open_browser: false  # true in local, false in CI

notifications:
  enabled: false         # Set to true for Slack/Email
  slack_webhook: ""
  email_recipients: []
```

---

## Test Environment Setup

### Overview

The test environment is orchestrated using Docker Compose to ensure consistency, isolation, and reproducibility across local development and CI/CD environments.

### Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Test Environment          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ Container 1: test-db (PostgreSQL)
         │  └─ Port: 5433 (isolated from dev database)
         │
         ├─ Container 2: test-redis (Redis)
         │  └─ Port: 6380 (isolated from dev Redis)
         │
         ├─ Container 3: backend-test-server
         │  ├─ Port: 8001
         │  ├─ Connected to: test-db, test-redis
         │  └─ Env: TEST_MODE=true
         │
         └─ Container 4: frontend-test-server
            ├─ Port: 3001
            ├─ Connected to: backend-test-server
            └─ Env: NEXT_PUBLIC_API_URL=http://backend-test-server:8001
```

### Docker Compose Configuration

**File**: `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  test-db:
    image: postgres:15-alpine
    container_name: dataaggregator-test-db
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: test_dataaggregator
    ports:
      - "5433:5432"
    volumes:
      - test_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - test-network

  test-redis:
    image: redis:7-alpine
    container_name: dataaggregator-test-redis
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - test-network

  backend-test-server:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    container_name: dataaggregator-backend-test
    environment:
      - DATABASE_URL=postgresql+asyncpg://test_user:test_password@test-db:5432/test_dataaggregator
      - REDIS_URL=redis://test-redis:6379/0
      - TEST_MODE=true
      - SECRET_KEY=test-secret-key-do-not-use-in-production
      - ENVIRONMENT=test
    ports:
      - "8001:8000"
    depends_on:
      test-db:
        condition: service_healthy
      test-redis:
        condition: service_healthy
    networks:
      - test-network

  frontend-test-server:
    build:
      context: ./frontend
      dockerfile: Dockerfile.test
    container_name: dataaggregator-frontend-test
    environment:
      - NEXT_PUBLIC_API_URL=http://backend-test-server:8000
      - NODE_ENV=test
    ports:
      - "3001:3000"
    depends_on:
      - backend-test-server
    networks:
      - test-network

networks:
  test-network:
    driver: bridge

volumes:
  test_db_data:
```

### Environment Setup Script

**File**: `testing/scripts/setup-test-env.sh`

```bash
#!/bin/bash
#
# Test Environment Setup
# Initializes the test environment and ensures all prerequisites are met
#

set -euo pipefail

echo "Setting up test environment..."

# Check prerequisites
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Python version
if ! python3 --version | grep -q "Python 3.1[0-9]"; then
    echo "ERROR: Python 3.10+ is required."
    exit 1
fi

# Check Node version
if ! node --version | grep -q "v[2-9][0-9]"; then
    echo "ERROR: Node.js 20+ is required."
    exit 1
fi

echo "✓ All prerequisites met"

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
poetry install --with dev
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Start Docker Compose environment
echo "Starting Docker Compose test environment..."
docker-compose -f docker-compose.test.yml up -d --build

# Wait for services
echo "Waiting for services to be ready..."
sleep 10

# Wait for PostgreSQL
until docker-compose -f docker-compose.test.yml exec -T test-db pg_isready -U test_user; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✓ PostgreSQL ready"

# Wait for Redis
until docker-compose -f docker-compose.test.yml exec -T test-redis redis-cli ping; do
    echo "Waiting for Redis..."
    sleep 2
done

echo "✓ Redis ready"

# Run database migrations
echo "Running database migrations..."
cd backend
poetry run alembic upgrade head
cd ..

# Seed test database
echo "Seeding test database..."
cd backend
poetry run python scripts/seed_test_data.py
cd ..

echo "✓ Test environment setup complete!"
echo ""
echo "Test environment is running at:"
echo "  - Backend:  http://localhost:8001"
echo "  - Frontend: http://localhost:3001"
echo "  - PostgreSQL: localhost:5433"
echo "  - Redis: localhost:6380"
echo ""
echo "To run tests: ./testing/scripts/run-tests.sh"
echo "To stop environment: docker-compose -f docker-compose.test.yml down"
```

### Database Seeding Script

**File**: `backend/scripts/seed_test_data.py`

```python
"""
Test Database Seeding Script
Seeds the test database with known test data for reproducible testing
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.core.config import settings
from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.core.security import get_password_hash

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5433/test_dataaggregator"

# Known test users (for reproducible E2E tests)
TEST_USERS = [
    {
        "username": "admin",
        "email": "admin@test.com",
        "password": "password",
        "role": "admin",
        "is_active": True,
    },
    {
        "username": "developer",
        "email": "dev@test.com",
        "password": "dev12345",
        "role": "developer",
        "is_active": True,
    },
    {
        "username": "designer",
        "email": "designer@test.com",
        "password": "designer123",
        "role": "designer",
        "is_active": True,
    },
    {
        "username": "executor",
        "email": "executor@test.com",
        "password": "executor123",
        "role": "executor",
        "is_active": True,
    },
    {
        "username": "viewer",
        "email": "viewer@test.com",
        "password": "viewer123",
        "role": "viewer",
        "is_active": True,
    },
    {
        "username": "executive",
        "email": "executive@test.com",
        "password": "executive123",
        "role": "executive",
        "is_active": True,
    },
]


async def seed_database():
    """Seed the test database with known test data"""

    # Create async engine
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        print("Seeding test database...")

        # Create test users
        print("Creating test users...")
        for user_data in TEST_USERS:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=user_data["is_active"],
            )
            session.add(user)

        await session.commit()
        print(f"✓ Created {len(TEST_USERS)} test users")

        print("✓ Test database seeded successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
```

### Environment Lifecycle

**Ephemeral Environment** (Created fresh for each full test run):

```
1. Setup Phase:
   ├─ Start Docker Compose (postgres, redis, backend, frontend)
   ├─ Wait for services (health checks)
   ├─ Run database migrations
   └─ Seed test data

2. Execution Phase:
   ├─ Run all test stages
   └─ Capture artifacts

3. Teardown Phase:
   ├─ Collect final reports
   ├─ Stop Docker Compose
   └─ Remove volumes (clean state)

Total Time: ~2-3 minutes overhead + test execution time
```

### Environment Variables

**Backend Test Environment** (`.env.test`):
```bash
DATABASE_URL=postgresql+asyncpg://test_user:test_password@localhost:5433/test_dataaggregator
REDIS_URL=redis://localhost:6380/0
SECRET_KEY=test-secret-key-do-not-use-in-production
ENVIRONMENT=test
TEST_MODE=true
LOG_LEVEL=INFO
```

**Frontend Test Environment** (`.env.test`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
NODE_ENV=test
```

---

## Test Reporting & Monitoring

### Overview

The test reporting system provides comprehensive visibility into test execution, failures, and trends through multi-format outputs and configurable artifact capture.

### Reporting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Execution                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
  │  Console  │  │   HTML    │  │JSON/XML   │
  │  Output   │  │  Reports  │  │ Reports   │
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
            ┌───────────┴───────────┐
            │   Artifact Storage    │
            │  (testing/reports/)   │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
  │ Coverage  │  │Screenshots│  │   Logs    │
  │  Reports  │  │ & Videos  │  │ & Traces  │
  └───────────┘  └───────────┘  └───────────┘
```

### Report Formats

#### 1. Console Output (Real-time)

**Features**:
- Color-coded output (green=pass, red=fail, yellow=warn)
- Progress indicators for each stage
- Real-time test execution feedback
- Summary statistics at the end

**Example**:
```
========================================
Stage 1: Backend Unit Tests
========================================
✓ test_user_model.py::test_create_user_with_valid_data ... PASSED
✓ test_user_model.py::test_create_user_duplicate_email ... PASSED
✗ test_pipeline_model.py::test_create_pipeline ... FAILED
  AssertionError: Expected 'Active', got 'Inactive'
  File: test_pipeline_model.py:45

[FAIL] Stage 1: Backend Unit Tests
  Total: 125 tests
  Passed: 124 (99.2%)
  Failed: 1 (0.8%)
  Duration: 45.3s

[FAIL-FAST] Stopping due to Stage 1 failures
```

#### 2. HTML Reports

**Backend Coverage Report** (`testing/reports/coverage/backend/index.html`):
- Line coverage by file/directory
- Branch coverage visualization
- Uncovered lines highlighted in red
- Coverage trends over time (if historical data available)

**Frontend Coverage Report** (`testing/reports/coverage/frontend/index.html`):
- Component coverage breakdown
- Hook coverage
- Utility function coverage
- Interactive file browser

**Playwright Test Report** (`testing/reports/e2e/index.html`):
- Test execution timeline
- Screenshots on failure
- Video recordings (if enabled)
- Test trace viewer
- Browser console logs

#### 3. JSON/XML Reports (CI/CD Integration)

**Test Results JSON** (`testing/reports/test-results.json`):
```json
{
  "summary": {
    "total_tests": 1247,
    "passed": 1245,
    "failed": 2,
    "skipped": 0,
    "duration_seconds": 623.4,
    "coverage": {
      "backend": 84.2,
      "frontend": 79.8
    }
  },
  "stages": [
    {
      "stage": 1,
      "name": "Backend Unit Tests",
      "status": "failed",
      "tests": 312,
      "passed": 311,
      "failed": 1,
      "duration_seconds": 45.3
    }
  ],
  "failures": [
    {
      "test": "test_pipeline_model.py::test_create_pipeline",
      "stage": 1,
      "error": "AssertionError: Expected 'Active', got 'Inactive'",
      "traceback": "...",
      "file": "test_pipeline_model.py",
      "line": 45
    }
  ]
}
```

**JUnit XML** (`testing/reports/junit.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="1247" failures="2" errors="0" time="623.4">
  <testsuite name="Stage 1: Backend Unit Tests" tests="312" failures="1" errors="0" time="45.3">
    <testcase classname="test_user_model" name="test_create_user_with_valid_data" time="0.12" />
    <testcase classname="test_pipeline_model" name="test_create_pipeline" time="0.15">
      <failure message="AssertionError: Expected 'Active', got 'Inactive'">
        File: test_pipeline_model.py:45
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

### Failure Artifacts

**Configurable Capture Levels**:

| Artifact Type | Minimal | Essential | Comprehensive |
|--------------|---------|-----------|---------------|
| Stack Traces | ✓ | ✓ | ✓ |
| HTML Reports | ✓ | ✓ | ✓ |
| Screenshots (E2E) | ✗ | ✓ | ✓ |
| Videos (E2E) | ✗ | ✗ | ✓ |
| Database Dumps | ✗ | ✗ | ✓ |
| API Logs | ✗ | ✓ | ✓ |
| App Logs | ✗ | ✓ | ✓ |
| Browser Logs | ✗ | ✗ | ✓ |

**Artifact Storage Structure**:
```
testing/reports/
├── coverage/
│   ├── backend/
│   │   ├── index.html
│   │   ├── coverage.json
│   │   └── ...
│   └── frontend/
│       ├── index.html
│       ├── lcov.info
│       └── ...
├── test-results/
│   ├── junit.xml
│   ├── test-results.json
│   └── playwright-results/
│       ├── index.html
│       └── ...
├── screenshots/
│   ├── test_pipeline_creation_failed_20251018_143025.png
│   └── ...
├── videos/
│   ├── test_user_journey_20251018_143025.webm
│   └── ...
└── logs/
    ├── backend_test_20251018.log
    ├── frontend_test_20251018.log
    └── pytest_output.txt
```

### Failure Traces

**Stack Trace Capture Example**:
```
FAILED test_pipeline_model.py::test_create_pipeline - AssertionError

========= FAILURE TRACE =========
File: testing/backend-tests/unit/models/test_pipeline_model.py
Line: 45
Function: test_create_pipeline

Traceback (most recent call last):
  File "/app/testing/backend-tests/unit/models/test_pipeline_model.py", line 45, in test_create_pipeline
    assert pipeline.status == "Active"
AssertionError: Expected 'Active', got 'Inactive'

Context:
  pipeline_data = {'name': 'Test Pipeline', 'source': 'database', 'destination': 'api'}
  pipeline = Pipeline(id=1, name='Test Pipeline', status='Inactive', created_at=2025-10-18 14:30:25)

Related Code (test_pipeline_model.py:40-50):
  40 | def test_create_pipeline():
  41 |     """Test pipeline creation with default status"""
  42 |     pipeline_data = {'name': 'Test Pipeline', 'source': 'database'}
  43 |     pipeline = PipelineFactory(**pipeline_data)
  44 |
  45 |     assert pipeline.status == "Active"  # FAILED HERE
  46 |     assert pipeline.name == "Test Pipeline"
  47 |     assert pipeline.source == "database"

Fixtures Used:
  - test_session (scope: function)
  - test_user (scope: function)

Environment:
  - Python: 3.10.12
  - pytest: 7.4.3
  - Database: PostgreSQL 15 (test-db container)
```

### Test Summary Report

**File**: `testing/reports/test-summary.txt`

```
╔════════════════════════════════════════════════════════════════╗
║         Data Aggregator Platform - Test Summary               ║
║         Execution Date: 2025-10-18 14:35:42                   ║
╚════════════════════════════════════════════════════════════════╝

OVERALL RESULTS
───────────────────────────────────────────────────────────────
Total Tests:       1,247
Passed:            1,245  (99.8%)
Failed:              2    (0.2%)
Skipped:             0    (0.0%)
Duration:          10m 23s
Status:            ✗ FAILED

COVERAGE
───────────────────────────────────────────────────────────────
Backend Overall:    84.2%  (Target: 80%) ✓
  Models:           89.5%
  Services:         83.1%
  Endpoints:        87.3%
  Core Utils:       78.9%

Frontend Overall:   79.8%  (Target: 80%) ✗ (0.2% below target)
  Components:       76.4%
  Hooks:            85.2%
  Pages:            72.1%
  Utils:            88.7%

STAGE RESULTS
───────────────────────────────────────────────────────────────
✓ Stage 1: Backend Unit Tests        [311/312 passed] (99.7%)
✗ Stage 2: Backend Integration Tests [SKIPPED - Stage 1 failed]
✗ Stage 3: Frontend Unit Tests       [SKIPPED - Stage 1 failed]
✗ Stage 4: Frontend Integration Tests [SKIPPED - Stage 1 failed]
✗ Stage 5: E2E Tests                 [SKIPPED - Stage 1 failed]
✗ Stage 6: Performance Tests         [SKIPPED - Stage 1 failed]
✗ Stage 7: Security Tests            [SKIPPED - Stage 1 failed]

FAILURES
───────────────────────────────────────────────────────────────
1. test_pipeline_model.py::test_create_pipeline
   Stage: 1 (Backend Unit Tests)
   Error: AssertionError: Expected 'Active', got 'Inactive'
   File: testing/backend-tests/unit/models/test_pipeline_model.py:45

2. test_connector_service.py::test_test_connection_timeout
   Stage: 1 (Backend Unit Tests)
   Error: TimeoutError: Connection test exceeded 10s timeout
   File: testing/backend-tests/unit/services/test_connector_service.py:78

RECOMMENDATIONS
───────────────────────────────────────────────────────────────
1. Fix test_create_pipeline assertion:
   - Expected default pipeline status to be 'Active'
   - Consider updating PipelineFactory default or test expectation

2. Investigate connector service timeout:
   - 10s timeout may be too aggressive for database connections
   - Consider increasing timeout or mocking external connections

REPORTS
───────────────────────────────────────────────────────────────
HTML Coverage:  testing/reports/coverage/backend/index.html
                testing/reports/coverage/frontend/index.html
Test Results:   testing/reports/test-results.json
Junit XML:      testing/reports/junit.xml
Logs:           testing/reports/logs/

Next Steps:
1. Review and fix the 2 failing tests
2. Re-run: ./testing/scripts/run-tests.sh
```

### Automated Report Generation

**File**: `testing/scripts/generate_summary.py`

```python
#!/usr/bin/env python3
"""
Generate Test Summary Report
Combines data from all test stages and generates a comprehensive summary
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def generate_summary():
    """Generate comprehensive test summary"""

    reports_dir = Path(__file__).parent.parent / "reports"

    # Load test results
    with open(reports_dir / "test-results.json") as f:
        results = json.load(f)

    # Load coverage data
    backend_cov = json.load(open(reports_dir / "coverage/backend/coverage.json"))
    frontend_cov = json.load(open(reports_dir / "coverage/frontend/coverage-summary.json"))

    # Generate summary (implementation details...)

    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         Data Aggregator Platform - Test Summary               ║")
    print(f"║         Execution Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                   ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    # ... (rest of summary generation)

if __name__ == "__main__":
    generate_summary()
```

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend && poetry install --with dev
          cd ../frontend && npm ci

      - name: Run test suite
        run: ./testing/scripts/run-tests.sh
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: testing/reports/

      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: testing/reports/coverage/backend/coverage.xml,testing/reports/coverage/frontend/lcov.info

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('testing/reports/test-summary.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '## Test Results\n\n```\n' + summary + '\n```'
            });
```

---

**End of Testing Framework Additions**
**Insert this content into AUTOMATED_TEST_SUITE_PLAN.md after line 673 (after "Test Data Management" section)**
