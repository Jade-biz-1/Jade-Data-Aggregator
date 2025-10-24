#!/bin/bash
# Test Configuration - Environment Variables
# Data Aggregator Platform Testing Framework

export TEST_MODE=true
export ENVIRONMENT=test

# Test Database Configuration
export TEST_DB_HOST=localhost
export TEST_DB_PORT=5433
export TEST_DB_USER=test_user
export TEST_DB_PASSWORD=test_password
export TEST_DB_NAME=dataaggregator_test
export TEST_DATABASE_URL="postgresql+asyncpg://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}"

# Test Redis Configuration
export TEST_REDIS_HOST=localhost
export TEST_REDIS_PORT=6380

# Test Backend/Frontend URLs
export TEST_BACKEND_URL="http://localhost:8001"
export TEST_FRONTEND_URL="http://localhost:3001"

# Coverage Thresholds
export BACKEND_COVERAGE_THRESHOLD=80
export FRONTEND_COVERAGE_THRESHOLD=80

echo "Test configuration loaded successfully"
