# Data Aggregator Platform - Testing Suite

## Overview

This document provides a comprehensive guide to the automated testing suite for the Data Aggregator Platform. The test suite covers backend unit tests, integration tests, frontend component tests, E2E tests, performance tests, and security tests.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.10+
- Node.js 20+
- Poetry (Python dependency management)
- npm (Node.js package manager)

### Running All Tests

```bash
# Run the complete test suite
./testing/scripts/run-tests.sh

# Run specific stage
./testing/scripts/run-tests.sh --stage 1  # Backend unit tests only

# Run with comprehensive artifact capture
./testing/scripts/run-tests.sh --capture-all

# Run without fail-fast (continue even if a stage fails)
./testing/scripts/run-tests.sh --no-fail-fast
```

### Running Individual Test Suites

**Backend Unit Tests:**
```bash
cd backend
poetry run pytest backend/tests/unit -v --cov=backend
```

**Backend Integration Tests:**
```bash
cd backend
poetry run pytest backend/tests/integration -v
```

**Frontend Unit Tests:**
```bash
cd frontend
npm run test:unit
```

**E2E Tests:**
```bash
cd frontend
npm run test
```

## Test Suite Architecture

### Directory Structure

```
dataaggregator/
├── testing/
│   ├── scripts/
│   │   ├── run-tests.sh           # Main test runner
│   │   ├── setup-test-env.sh      # Environment setup
│   │   ├── teardown-test-env.sh   # Environment cleanup
│   │   └── generate_summary.py    # Report generation
│   ├── config/
│   │   ├── test-config.sh         # Shell configuration
│   │   └── test-config.yml        # YAML configuration
│   ├── reports/                   # Test reports (git-ignored)
│   │   ├── coverage/             # Coverage reports
│   │   ├── test-results/         # Test results
│   │   ├── screenshots/          # E2E screenshots
│   │   ├── videos/               # E2E videos
│   │   └── logs/                 # Test logs
│   ├── backend-tests/            # Backend test organization
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── e2e/
│   │   ├── performance/
│   │   └── security/
│   └── frontend-tests/           # Frontend test organization
│       ├── unit/
│       ├── integration/
│       ├── e2e/
│       ├── performance/
│       └── visual/
├── backend/
│   └── backend/tests/            # Actual backend tests
│       ├── conftest.py           # Test fixtures
│       ├── unit/
│       │   ├── models/           # Model tests
│       │   ├── services/         # Service tests
│       │   ├── endpoints/        # API endpoint tests
│       │   └── core/             # Core utility tests
│       ├── integration/          # Integration tests
│       ├── performance/          # Performance tests
│       └── security/             # Security tests
└── frontend/
    ├── __tests__/                # Frontend unit tests
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   └── utils/
    └── tests/                    # E2E tests
        └── e2e/
```

## Test Stages

The test runner executes tests in 7 stages with fail-fast between stages:

1. **Backend Unit Tests** - Models, services, endpoints, core utilities
2. **Backend Integration Tests** - CRUD workflows, database operations, API integration
3. **Frontend Unit Tests** - Components, hooks, pages, utilities
4. **Frontend Integration Tests** - API integration, form submission, navigation
5. **E2E Tests** - Critical user journeys, authentication, RBAC
6. **Performance Tests** - API benchmarks, database performance, frontend metrics
7. **Security Tests** - OWASP Top 10, authentication security, dependency scanning

## Test Environment

### Docker Compose Test Environment

The test environment uses isolated Docker containers:

- **test-db**: PostgreSQL 15 (port 5433)
- **test-redis**: Redis 7 (port 6380)
- **backend-test-server**: FastAPI backend (port 8001)
- **frontend-test-server**: Next.js frontend (port 3001)

### Setup Test Environment

```bash
./testing/scripts/setup-test-env.sh
```

This script:
- Checks prerequisites (Docker, Python, Node.js)
- Installs dependencies
- Starts Docker Compose services
- Runs database migrations
- Seeds test data

### Teardown Test Environment

```bash
./testing/scripts/teardown-test-env.sh
```

## Test Data

### Test Users

The test database is seeded with 6 test users (one for each role):

| Username   | Email                 | Password          | Role      |
|------------|-----------------------|-------------------|-----------|
| admin      | admin@test.com        | Admin123!@#       | admin     |
| developer  | dev@test.com          | Dev123!@#         | developer |
| designer   | designer@test.com     | Designer123!@#    | designer  |
| executor   | executor@test.com     | Executor123!@#    | executor  |
| viewer     | viewer@test.com       | Viewer123!@#      | viewer    |
| executive  | executive@test.com    | Executive123!@#   | executive |

These users are available in E2E tests for testing RBAC scenarios.

## Coverage Targets

- **Backend Overall**: 85%
  - Models: 90%
  - Services: 85%
  - Endpoints: 90%
  - Core Utilities: 80%

- **Frontend Overall**: 80%
  - Components: 75%
  - Hooks: 85%
  - Pages: 75%
  - Utilities: 80%

## Test Reports

After running tests, reports are generated in `testing/reports/`:

- **Coverage Reports**: `testing/reports/coverage/backend/index.html`
- **Test Results JSON**: `testing/reports/test-results.json`
- **Test Summary**: `testing/reports/test-summary.txt`
- **Screenshots** (E2E failures): `testing/reports/screenshots/`
- **Videos** (if enabled): `testing/reports/videos/`
- **Logs**: `testing/reports/logs/`

### Viewing Reports

```bash
# Open backend coverage report
open testing/reports/coverage/backend/index.html

# Open frontend coverage report
open testing/reports/coverage/frontend/index.html

# View test summary
cat testing/reports/test-summary.txt
```

## Writing Tests

### Backend Unit Tests

Example test for a model:

```python
import pytest
from backend.models.user import User
from backend.core.security import get_password_hash

def test_create_user(test_session):
    """Test creating a user with valid data"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("Test123!@#"),
        role="viewer"
    )
    test_session.add(user)
    test_session.commit()

    assert user.id is not None
    assert user.username == "testuser"
```

### Frontend Unit Tests

Example test for a component:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

Example E2E test:

```typescript
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'Admin123!@#');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## CI/CD Integration

The test suite integrates with GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run test suite
        run: ./testing/scripts/run-tests.sh
```

## Troubleshooting

### Docker Issues

```bash
# If Docker Compose services won't start
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d --build

# Check service logs
docker-compose -f docker-compose.test.yml logs test-db
docker-compose -f docker-compose.test.yml logs backend-test-server
```

### Database Migration Issues

```bash
# Reset test database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d test-db

# Run migrations manually
cd backend
poetry run alembic upgrade head
```

### Test Failures

```bash
# Run tests with verbose output
cd backend
poetry run pytest -vv --tb=short

# Run specific test file
poetry run pytest backend/tests/unit/models/test_user_model.py -v

# Run specific test
poetry run pytest backend/tests/unit/models/test_user_model.py::TestUserModel::test_create_user -v
```

## Performance Considerations

- **Parallel Execution**: Tests run in parallel (4 workers for backend, 50% CPU for frontend)
- **In-Memory Database**: Unit tests use in-memory SQLite for speed
- **Test Isolation**: Each test has its own database session
- **Fixture Scoping**: Expensive fixtures use session/module scope

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Keep tests focused
3. **Use Descriptive Names**: Test names should explain what they test
4. **Test Edge Cases**: Don't just test the happy path
5. **Mock External Dependencies**: Keep tests fast and reliable
6. **Clean Up**: Use fixtures to ensure test isolation
7. **Document Complex Tests**: Add comments for non-obvious logic

## Next Steps

Refer to the full implementation plan:
- `docs/AUTOMATED_TEST_SUITE_PLAN.md` - Complete testing strategy
- `docs/TESTING_IMPLEMENTATION_TASKS.md` - Implementation roadmap

## Support

For questions or issues with the testing suite, please create an issue in the repository or contact the engineering team.
