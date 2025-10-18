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
