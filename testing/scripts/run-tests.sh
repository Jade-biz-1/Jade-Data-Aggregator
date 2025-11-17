#!/bin/bash
# Unified Test Runner Script
# Data Aggregator Platform Testing Framework
# Runs all test stages with fail-fast and comprehensive reporting

set -eo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PYTHON_BIN=${PYTHON_BIN:-python3}

# Load configuration
source "${PROJECT_ROOT}/testing/config/test-config.sh"

# Global variables
FAIL_FAST=${FAIL_FAST_ENABLED:-true}
STAGE_TO_RUN="all"
CAPTURE_ALL=false
EXIT_CODE=0

# Test results
declare -A STAGE_RESULTS
declare -A STAGE_DURATIONS

# Parse command line arguments
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
            CAPTURE_ALL=true
            export ARTIFACT_CAPTURE_LEVEL=comprehensive
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --stage STAGE         Run specific stage (backend_unit|backend_integration|frontend_unit|frontend_integration|e2e|performance|security|all)"
            echo "  --no-fail-fast        Continue running tests even if a stage fails"
            echo "  --capture-all         Capture all artifacts (comprehensive mode)"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Print header
print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║         Data Aggregator Platform - Test Suite               ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print stage header
print_stage_header() {
    local stage=$1
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}▶ Stage: $stage${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Print stage result
print_stage_result() {
    local stage=$1
    local result=$2
    local duration=$3
    
    if [ "$result" == "PASSED" ]; then
        echo -e "${GREEN}✓ $stage: PASSED ($duration)${NC}"
    elif [ "$result" == "FAILED" ]; then
        echo -e "${RED}✗ $stage: FAILED ($duration)${NC}"
    elif [ "$result" == "SKIPPED" ]; then
        echo -e "${YELLOW}⊘ $stage: SKIPPED${NC}"
    fi
}

# Run backend unit tests
run_backend_unit_tests() {
    print_stage_header "Backend Unit Tests"
    local start_time=$(date +%s)
    
    cd "${PROJECT_ROOT}/backend"
    
    if PYTHONPATH="${PROJECT_ROOT}/backend:${PYTHONPATH}" \
        ${PYTHON_BIN} -m pytest ../testing/backend-tests/unit/ -v 2>&1 | tee ../testing/reports/logs/backend-unit.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[backend_unit]="PASSED"
        STAGE_DURATIONS[backend_unit]=$duration
        cd "${PROJECT_ROOT}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[backend_unit]="FAILED"
        STAGE_DURATIONS[backend_unit]=$duration
        cd "${PROJECT_ROOT}"
        return 1
    fi
}

# Run backend integration tests
run_backend_integration_tests() {
    print_stage_header "Backend Integration Tests"
    local start_time=$(date +%s)
    
    cd "${PROJECT_ROOT}/backend"
    
    if PYTHONPATH="${PROJECT_ROOT}/backend:${PYTHONPATH}" \
        ${PYTHON_BIN} -m pytest ../testing/backend-tests/integration/ -v --tb=short 2>&1 | tee ../testing/reports/logs/backend-integration.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[backend_integration]="PASSED"
        STAGE_DURATIONS[backend_integration]=$duration
        cd "${PROJECT_ROOT}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[backend_integration]="FAILED"
        STAGE_DURATIONS[backend_integration]=$duration
        cd "${PROJECT_ROOT}"
        return 1
    fi
}

# Run frontend unit tests
run_frontend_unit_tests() {
    print_stage_header "Frontend Unit Tests"
    local start_time=$(date +%s)
    
    cd "${PROJECT_ROOT}/testing/frontend-tests"
    
    if npm run test:unit:coverage -- --watchAll=false 2>&1 | tee ../reports/logs/frontend-unit.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[frontend_unit]="PASSED"
        STAGE_DURATIONS[frontend_unit]=$duration
        cd "${PROJECT_ROOT}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[frontend_unit]="FAILED"
        STAGE_DURATIONS[frontend_unit]=$duration
        cd "${PROJECT_ROOT}"
        return 1
    fi
}

# Run E2E tests
run_e2e_tests() {
    print_stage_header "End-to-End Tests"
    local start_time=$(date +%s)
    
    cd "${PROJECT_ROOT}/testing/frontend-tests"
    
    if npm run test:e2e 2>&1 | tee ../reports/logs/e2e.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[e2e]="PASSED"
        STAGE_DURATIONS[e2e]=$duration
        cd "${PROJECT_ROOT}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))s
        STAGE_RESULTS[e2e]="FAILED"
        STAGE_DURATIONS[e2e]=$duration
        cd "${PROJECT_ROOT}"
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    echo -e "${CYAN}Configuration:${NC}"
    echo -e "  Stage: ${YELLOW}$STAGE_TO_RUN${NC}"
    echo -e "  Fail Fast: ${YELLOW}$FAIL_FAST${NC}"
    echo -e "  Artifact Level: ${YELLOW}$ARTIFACT_CAPTURE_LEVEL${NC}"
    echo ""
    
    # Create reports directories
    mkdir -p "${PROJECT_ROOT}/testing/reports/logs"
    mkdir -p "${PROJECT_ROOT}/testing/reports/coverage"
    
    # Run tests based on stage
    if [ "$STAGE_TO_RUN" == "all" ] || [ "$STAGE_TO_RUN" == "backend_unit" ]; then
        if run_backend_unit_tests; then
            print_stage_result "Backend Unit Tests" "PASSED" "${STAGE_DURATIONS[backend_unit]}"
        else
            print_stage_result "Backend Unit Tests" "FAILED" "${STAGE_DURATIONS[backend_unit]}"
            EXIT_CODE=1
            if [ "$FAIL_FAST" == "true" ]; then
                echo -e "${RED}Failing fast due to test failure${NC}"
                exit $EXIT_CODE
            fi
        fi
    fi
    
    if [ "$STAGE_TO_RUN" == "all" ] || [ "$STAGE_TO_RUN" == "backend_integration" ]; then
        if run_backend_integration_tests; then
            print_stage_result "Backend Integration Tests" "PASSED" "${STAGE_DURATIONS[backend_integration]}"
        else
            print_stage_result "Backend Integration Tests" "FAILED" "${STAGE_DURATIONS[backend_integration]}"
            EXIT_CODE=1
            if [ "$FAIL_FAST" == "true" ]; then
                echo -e "${RED}Failing fast due to test failure${NC}"
                exit $EXIT_CODE
            fi
        fi
    fi
    
    if [ "$STAGE_TO_RUN" == "all" ] || [ "$STAGE_TO_RUN" == "frontend_unit" ]; then
        if run_frontend_unit_tests; then
            print_stage_result "Frontend Unit Tests" "PASSED" "${STAGE_DURATIONS[frontend_unit]}"
        else
            print_stage_result "Frontend Unit Tests" "FAILED" "${STAGE_DURATIONS[frontend_unit]}"
            EXIT_CODE=1
            if [ "$FAIL_FAST" == "true" ]; then
                echo -e "${RED}Failing fast due to test failure${NC}"
                exit $EXIT_CODE
            fi
        fi
    fi
    
    if [ "$STAGE_TO_RUN" == "all" ] || [ "$STAGE_TO_RUN" == "e2e" ]; then
        if run_e2e_tests; then
            print_stage_result "End-to-End Tests" "PASSED" "${STAGE_DURATIONS[e2e]}"
        else
            print_stage_result "End-to-End Tests" "FAILED" "${STAGE_DURATIONS[e2e]}"
            EXIT_CODE=1
        fi
    fi
    
    # Print final summary
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     TEST SUMMARY                             ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    for stage in "${!STAGE_RESULTS[@]}"; do
        print_stage_result "$stage" "${STAGE_RESULTS[$stage]}" "${STAGE_DURATIONS[$stage]}"
    done
    
    echo ""
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
    else
        echo -e "${RED}✗ Some tests failed${NC}"
    fi
    echo ""
    
    exit $EXIT_CODE
}

# Run main
main
