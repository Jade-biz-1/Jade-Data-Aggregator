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
