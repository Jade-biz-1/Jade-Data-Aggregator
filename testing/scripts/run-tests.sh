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
    until docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" exec -T test-db pg_isready -U test_user; do
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
    poetry run coverage combine || true
    poetry run coverage html -d "$REPORTS_DIR/coverage/backend" || true
    poetry run coverage json -o "$REPORTS_DIR/coverage/backend/coverage.json" || true

    # Frontend coverage
    cd "$PROJECT_ROOT/frontend"
    if [ -d coverage ]; then
        cp -r coverage/* "$REPORTS_DIR/coverage/frontend/" || true
    fi

    # Generate summary report
    if [ -f "$TESTING_DIR/scripts/generate_summary.py" ]; then
        python3 "$TESTING_DIR/scripts/generate_summary.py" > "$REPORTS_DIR/test-summary.txt" || true
    fi

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
            "cd $PROJECT_ROOT/backend && poetry run pytest backend/tests/unit -v --cov=backend --cov-report=html"; then
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
                "cd $PROJECT_ROOT/backend && poetry run pytest backend/tests/integration -v --cov=backend --cov-append"; then
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
                "cd $PROJECT_ROOT/backend && poetry run pytest backend/tests/performance -v"; then
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
                "cd $PROJECT_ROOT/backend && poetry run pytest backend/tests/security -v && poetry run bandit -r backend/ && poetry run safety check"; then
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
