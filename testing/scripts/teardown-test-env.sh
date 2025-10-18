#!/bin/bash
#
# Test Environment Teardown
# Stops and cleans up the test environment
#

set -euo pipefail

echo "Tearing down test environment..."

# Stop Docker Compose services
docker-compose -f docker-compose.test.yml down -v

echo "✓ Test environment cleaned up!"
