# Testing Infrastructure
**Data Aggregator Platform - Automated Testing Framework**

Last Updated: October 23, 2025

---

## 📋 Overview

This directory contains the complete testing infrastructure for the Data Aggregator Platform, including:

- Test configuration files
- Docker Compose test environment
- Unified test execution framework
- Test data seeding scripts
- Automated reporting tools

---

## 🗂️ Directory Structure

```
testing/
├── config/                      # Test configuration files
│   ├── test-config.sh          # Shell environment variables
│   └── test-config.yml         # YAML configuration
│
├── scripts/                     # Test execution scripts
│   ├── setup-test-env.sh       # Set up test environment
│   ├── run-tests.sh            # Unified test runner
│   ├── teardown-test-env.sh    # Clean up test environment
│   ├── check-prerequisites.sh  # Verify prerequisites
│   └── generate_summary.py     # Generate test reports
│
├── reports/                     # Test artifacts (gitignored)
│   ├── coverage/               # Coverage reports
│   ├── test-results/           # Test results (JUnit XML, JSON)
│   ├── screenshots/            # E2E test screenshots
│   ├── videos/                 # E2E test videos
│   └── logs/                   # Test execution logs
│
├── backend-tests/              # Backend test organization
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # E2E tests
│   ├── performance/            # Performance tests
│   └── security/               # Security tests
│
└── frontend-tests/             # Frontend test organization
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    ├── e2e/                    # E2E tests
    ├── performance/            # Performance tests
    └── visual/                 # Visual regression tests
```

---

## 🚀 Quick Start

### Step 1: Check Prerequisites

```bash
./testing/scripts/check-prerequisites.sh
```

**Required:**
- Docker
- Docker Compose
- Python 3.10+
- Node.js 18+

**Optional:**
- Poetry (for backend dependency management)

### Step 2: Set Up Test Environment

```bash
./testing/scripts/setup-test-env.sh
```

This script will:
1. Check prerequisites
2. Stop any existing test containers
3. Start test database (PostgreSQL on port 5433)
4. Start test Redis (on port 6380)
5. Wait for services to be healthy
6. Run database migrations
7. Seed test database with test users

### Step 3: Run Tests

```bash
# Run all tests
./testing/scripts/run-tests.sh

# Run specific stage
./testing/scripts/run-tests.sh --stage backend_unit

# Run without fail-fast
./testing/scripts/run-tests.sh --no-fail-fast

# Capture all artifacts
./testing/scripts/run-tests.sh --capture-all
```

### Step 4: Clean Up

```bash
./testing/scripts/teardown-test-env.sh
```

---

## 🧪 Test Stages

The testing framework executes tests in 7 stages:

1. **Backend Unit Tests** - Test individual backend components
2. **Backend Integration Tests** - Test backend API endpoints end-to-end
3. **Frontend Unit Tests** - Test React components and hooks
4. **Frontend Integration Tests** - Test frontend page workflows
5. **E2E Tests** - Test complete user journeys
6. **Performance Tests** - Test API performance and page load times
7. **Security Tests** - Test for vulnerabilities (OWASP Top 10)

---

## 🔧 Configuration

### Test Configuration Files

**`config/test-config.sh`** - Shell environment variables
- Test database URL
- Test Redis URL
- Test execution settings
- Coverage thresholds

**`config/test-config.yml`** - YAML configuration
- Test stages
- Parallel execution settings
- Artifact capture settings
- Browser settings for E2E tests

### Test Environment Variables

The test environment uses isolated services:

| Service | Development | Test |
|---------|-------------|------|
| PostgreSQL | localhost:5432 | localhost:5433 |
| Redis | localhost:6379 | localhost:6380 |
| Backend | localhost:8001 | localhost:8001 (test mode) |
| Frontend | localhost:3000 | localhost:3001 |

### Test User Credentials

The following test users are created during setup:

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | AdminTest123! | admin |
| developer@test.com | DevTest123! | developer |
| designer@test.com | DesignerTest123! | designer |
| executor@test.com | ExecutorTest123! | executor |
| viewer@test.com | ViewerTest123! | viewer |
| executive@test.com | ExecutiveTest123! | executive |

---

## 📊 Test Reports

Test artifacts are generated in the `testing/reports/` directory:

### Coverage Reports

- **Backend**: `reports/coverage/backend-unit/index.html`
- **Frontend**: `reports/coverage/frontend-unit/index.html`

Open these HTML files in a browser to view detailed coverage reports.

### Test Results

- **JUnit XML**: `reports/test-results/*.xml` (for CI integration)
- **JSON**: `reports/test-results/*.json` (for programmatic access)

### E2E Artifacts

- **Screenshots**: `reports/screenshots/` (on failure)
- **Videos**: `reports/videos/` (on failure)
- **Traces**: `reports/traces/` (on failure, for debugging)

### Logs

- **Backend Unit**: `reports/logs/backend-unit.log`
- **Backend Integration**: `reports/logs/backend-integration.log`
- **Frontend Unit**: `reports/logs/frontend-unit.log`
- **E2E**: `reports/logs/e2e.log`

---

## 🎯 Coverage Targets

### Current Status (as of October 23, 2025)

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| Backend | 40% | 85% | ⚠️ In Progress |
| Frontend | ~45% | 80% | ⚠️ In Progress |

### Coverage Thresholds

Tests will fail if coverage drops below:
- Backend: 80%
- Frontend: 80%

Configure thresholds in:
- `backend/pytest.ini` (backend)
- `frontend/jest.config.js` (frontend)

---

## 🔄 Test Execution Options

### Run Specific Stage

```bash
# Backend unit tests only
./testing/scripts/run-tests.sh --stage backend_unit

# Frontend unit tests only
./testing/scripts/run-tests.sh --stage frontend_unit

# E2E tests only
./testing/scripts/run-tests.sh --stage e2e
```

### Fail-Fast vs Continue

```bash
# Stop on first failure (default)
./testing/scripts/run-tests.sh

# Continue even if a stage fails
./testing/scripts/run-tests.sh --no-fail-fast
```

### Artifact Capture Levels

```bash
# Essential artifacts only (default)
./testing/scripts/run-tests.sh

# Capture all artifacts (screenshots, videos, traces)
./testing/scripts/run-tests.sh --capture-all
```

---

## 🐳 Docker Compose Test Environment

### Services

The test environment includes:

- **test-db**: PostgreSQL 15 (port 5433)
- **test-redis**: Redis 7 (port 6380)
- **backend-test**: Backend API in test mode (port 8001)
- **frontend-test**: Frontend app in test mode (port 3001)

### Manual Docker Commands

```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# View logs
docker compose -f docker-compose.test.yml logs -f

# Stop test environment
docker compose -f docker-compose.test.yml down

# Stop and remove volumes
docker compose -f docker-compose.test.yml down -v
```

### Health Checks

All services include health checks to ensure they're ready before tests run:

- Database: `pg_isready` check
- Redis: `redis-cli ping` check
- Backend: `/health/live` endpoint check
- Frontend: HTTP check on port 3000

---

## 📝 Writing Tests

### Backend Tests

**Location**: `backend/tests/`

```python
# Example: backend/tests/unit/models/test_user_model.py
import pytest
from backend.models.user import User

def test_user_creation():
    user = User(
        email="test@example.com",
        full_name="Test User",
        role="viewer"
    )
    assert user.email == "test@example.com"
    assert user.role == "viewer"
```

**Run backend tests:**
```bash
cd backend
poetry run pytest
```

### Frontend Tests

**Location**: `frontend/__tests__/` or `frontend/tests/`

```typescript
// Example: frontend/__tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**Run frontend tests:**
```bash
cd frontend
npm run test
```

### E2E Tests

**Location**: `frontend/tests/e2e/`

```typescript
// Example: frontend/tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3001/auth/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'AdminTest123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

**Run E2E tests:**
```bash
cd frontend
npm run test:e2e
```

---

## 🛠️ Troubleshooting

### Test Database Connection Issues

```bash
# Check if test database is running
docker ps | grep test-db

# Check database logs
docker logs dataaggregator-test-db

# Manually connect to test database
docker exec -it dataaggregator-test-db psql -U test_user -d dataaggregator_test
```

### Test Redis Connection Issues

```bash
# Check if test Redis is running
docker ps | grep test-redis

# Test Redis connection
docker exec -it dataaggregator-test-redis redis-cli ping
```

### Port Conflicts

If ports 5433 or 6380 are already in use:

1. Find and stop the conflicting service
2. Or modify `docker-compose.test.yml` to use different ports
3. Update `testing/config/test-config.sh` with new ports

### Clean Start

```bash
# Stop all containers and remove volumes
docker compose -f docker-compose.test.yml down -v

# Remove all test data
rm -rf testing/reports/*

# Start fresh
./testing/scripts/setup-test-env.sh
```

---

## 📚 Additional Resources

- **Testing Guidelines**: `docs/TESTING_GUIDELINES.md` (to be created)
- **Test Suite Overview**: `docs/TEST_SUITE_OVERVIEW.md` (to be created)
- **Implementation Tasks**: `docs/TESTING_IMPLEMENTATION_TASKS.md`
- **Automated Test Plan**: `docs/AUTOMATED_TEST_SUITE_PLAN.md`

---

## 🎯 Next Steps

Now that the testing infrastructure is set up:

1. **Week 1**: Write backend model tests (65+ tests)
2. **Week 2**: Write frontend critical tests (160+ tests)
3. **Week 3**: Enhance E2E tests (75+ tests)
4. **Week 4**: Set up CI/CD integration

See `oct_23_tasks.md` for the complete roadmap.

---

## 📞 Support

For questions or issues with the testing infrastructure:

1. Check this README first
2. Review `oct_23_tasks.md` for context
3. Check test logs in `testing/reports/logs/`
4. Open an issue with test output and error messages

---

**Last Updated**: October 23, 2025
**Status**: Infrastructure Complete - Ready for Test Writing
**Next**: Begin writing backend model tests (Week 1, Task T1.1)
