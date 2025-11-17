# Automated Test Suite Plan
**Data Aggregator Platform**

## Document Information
- **Version**: 1.0
- **Date**: October 18, 2025
- **Status**: Phase 10 - Testing Excellence Initiative
- **Author**: Engineering Team
- **Last Updated**: October 18, 2025

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Testing Strategy](#testing-strategy)
4. [Test Suite Architecture](#test-suite-architecture)
5. [Test Execution Framework](#test-execution-framework)
6. [Test Environment Setup](#test-environment-setup)
7. [Test Reporting & Monitoring](#test-reporting--monitoring)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Testing Frameworks & Tools](#testing-frameworks--tools)
10. [Quality Metrics & KPIs](#quality-metrics--kpis)
11. [Appendix](#appendix)

---

## Executive Summary

### Purpose
This document outlines a comprehensive plan to develop, implement, and maintain an automated test suite for the Data Aggregator Platform, elevating code quality from the current 40% testing coverage to 80%+ across all layers.

### Current State
- **Backend Testing**: 40% coverage (8 test files, 919 lines, ~80 test cases)
- **Frontend Testing**: ~25% coverage (11 test files, 2,873 lines, ~211 test cases)
- **Total Test Files**: 19 files covering 244+ source files
- **Coverage Gap**: Only 7.8% of source files have associated tests

### Goals
- **Backend**: Achieve 85%+ code coverage across all services and endpoints
- **Frontend**: Achieve 80%+ code coverage across components, hooks, and pages
- **E2E**: Implement comprehensive end-to-end test suite covering all critical user journeys
- **Performance**: Establish baseline performance benchmarks and regression tests
- **Security**: Implement automated security testing (OWASP ZAP, dependency scanning)
- **CI/CD Integration**: Full test automation in GitHub Actions pipeline

### Success Metrics
- **Code Coverage**: Backend 85%+, Frontend 80%+
- **Test Count**: 1,500+ total test cases (from current 291)
- **Build Time**: < 15 minutes for full test suite
- **Test Reliability**: < 1% flaky test rate
- **Bug Detection**: 90%+ of bugs caught before production

---

## Current State Analysis

### Inventory of Existing Tests

#### Backend Tests (8 files, 919 lines)

**Unit Tests (6 files, 649 lines)**
1. `test_analytics_endpoints.py` - 11 tests (route existence, auth guards)
2. `test_cleanup_service.py` - 25 tests (service operations with mocks)
3. `test_dashboard_endpoints.py` - 8 tests (route existence, auth guards)
4. `test_monitoring_endpoints.py` - 14 tests (route existence, auth guards)
5. `test_permission_service.py` - 45 tests (comprehensive RBAC logic)
6. `test_users_endpoints.py` - 12 tests (route existence, auth guards)

**Integration Tests (2 files, 270 lines)**
1. `test_auth_flow.py` - 6 tests (full authentication flow)
2. `test_rbac_endpoints.py` - 20 tests (role-based access control)

**E2E Tests**
- Directory exists but no tests implemented

#### Frontend Tests (11 files, 2,873 lines)

**Unit Tests (4 files, 2,009 lines)**
1. `ThemeToggle.test.tsx` - 90+ tests (component interactions)
2. `ThemeContext.test.tsx` - 70+ tests (context logic)
3. `usePermissions.test.ts` - 100+ tests (permission checks)
4. Test utilities: `test-utils.tsx`, `mocks.ts`

**E2E Tests (7 files, 864 lines)**
1. `auth.spec.ts` - ~12 tests (authentication flows)
2. `dashboard.spec.ts` - ~5 tests (basic dashboard)
3. `rbac.spec.ts` - ~25 tests (role-based access)
4. `pipelines.spec.ts` - ~10 tests (pipeline management)
5. `users.spec.ts` - ~8 tests (user management)
6. `search.spec.ts` - ~5 tests (search functionality)
7. `accessibility.spec.ts` - ~3 tests (a11y compliance)
8. E2E helpers: `helpers.ts`, `test-data.ts`

### Test Coverage Analysis

#### Well-Tested Areas (70%+ coverage)
- ✅ Permission/RBAC system (backend)
- ✅ Theme system (frontend context, hook, component)
- ✅ usePermissions hook (frontend)
- ✅ Authentication flow (E2E)
- ✅ Cleanup service operations (backend)

#### Partially Tested Areas (30-70% coverage)
- ⚠️ API endpoint existence checks
- ⚠️ Basic CRUD operations (minimal)
- ⚠️ Dashboard features
- ⚠️ Error handling scenarios

#### Untested Areas (< 10% coverage)
- ❌ **Backend (Critical Gaps)**:
  - Database models (13 model files)
  - Service layer business logic (25+ services)
  - Data validation logic
  - Transformation engine
  - WebSocket functionality
  - File processing service
  - Schema introspection
  - Analytics engine
  - Template management
  - Email service
  - Pipeline execution engine

- ❌ **Frontend (Critical Gaps)**:
  - 80+ components (only 2 tested)
  - 8+ hooks (only 1 tested)
  - Page components (26 routes)
  - Form components and validation
  - Pipeline builder (React Flow)
  - Data tables
  - Chart components
  - Admin interfaces
  - Real-time features
  - File upload UI
  - Schema mapping UI
  - Transformation builder
  - Error boundaries

### Testing Frameworks in Use

#### Backend
- **pytest** (7.4.3) - Primary test framework
- **pytest-asyncio** (0.21.1) - Async test support
- **pytest-cov** (4.1.0) - Coverage reporting
- **httpx** (0.25.2) - HTTP client for API testing
- **factory-boy** (3.3.0) - Test data generation
- **faker** (20.1.0) - Fake data generation
- **SQLite in-memory** - Test database isolation

#### Frontend
- **Jest** (30.2.0) - Unit test framework
- **@testing-library/react** (16.3.0) - Component testing
- **@testing-library/jest-dom** (6.9.1) - DOM matchers
- **@testing-library/user-event** (14.6.1) - User interaction simulation
- **Playwright** (1.56.0) - E2E testing
- **@axe-core/playwright** (4.10.2) - Accessibility testing

### Infrastructure
- **CI/CD**: GitHub Actions (configured)
- **Coverage Reporting**: HTML + Terminal (backend), Jest HTML (frontend)
- **Test Isolation**: In-memory SQLite (backend), jsdom (frontend)
- **Parallel Execution**: Pytest parallel (backend), Playwright parallel (frontend)

---

## Testing Strategy

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   Manual Tests  │ (5% - Exploratory, UAT)
                    └─────────────────┘
                ┌───────────────────────┐
                │   E2E Tests (15%)     │ (Critical user journeys)
                └───────────────────────┘
            ┌──────────────────────────────┐
            │  Integration Tests (25%)     │ (API contracts, DB operations)
            └──────────────────────────────┘
        ┌──────────────────────────────────────┐
        │      Unit Tests (55%)                │ (Functions, components, services)
        └──────────────────────────────────────┘
```

### Testing Levels

#### 1. Unit Tests (Target: 55% of total tests)

**Purpose**: Test individual functions, classes, and components in isolation

**Backend Unit Tests**:
- Database models (create, read, update, delete)
- Service layer methods (business logic)
- Utility functions (validation, transformation)
- Schema validation
- Configuration parsing
- Data transformation functions

**Frontend Unit Tests**:
- React components (render, props, state)
- Custom hooks (logic, state management)
- Utility functions (formatting, validation)
- Form validation logic
- Store actions and selectors

**Characteristics**:
- Fast execution (< 100ms per test)
- No external dependencies (mocked)
- High isolation
- Deterministic results
- High coverage (80%+ lines)

#### 2. Integration Tests (Target: 25% of total tests)

**Purpose**: Test interactions between components/services

**Backend Integration Tests**:
- API endpoint testing (full request/response)
- Database integration (actual DB operations)
- Service-to-service communication
- Authentication/authorization flows
- File upload/download workflows
- WebSocket connections
- Cache integration (Redis)
- Event publishing/consuming (Kafka)

**Frontend Integration Tests**:
- API integration (with mocked backend)
- Form submission workflows
- Multi-component interactions
- Router navigation
- State management integration
- WebSocket client integration

**Characteristics**:
- Moderate execution time (< 1s per test)
- Real database (test instance)
- Limited external mocking
- Test actual integrations
- Medium coverage (60-70% lines)

#### 3. End-to-End Tests (Target: 15% of total tests)

**Purpose**: Test complete user workflows from UI to database

**Critical User Journeys**:
1. User registration and login
2. Pipeline creation and execution
3. Connector configuration and testing
4. Data transformation setup
5. User management (admin)
6. Dashboard monitoring
7. Analytics and reporting
8. System maintenance operations
9. File upload and processing
10. Search and filtering

**Characteristics**:
- Slower execution (5-30s per test)
- Full stack integration
- Real browser automation
- Data persistence verification
- Lower coverage (focus on workflows)

#### 4. Performance Tests (Target: 3% of total tests)

**Purpose**: Validate system performance and scalability

**Performance Test Types**:
- Load testing (100-1000 concurrent users)
- Stress testing (system limits)
- Spike testing (sudden traffic)
- Endurance testing (sustained load)
- API response time benchmarks

**Tools**: Locust, K6, Apache JMeter

#### 5. Security Tests (Target: 2% of total tests)

**Purpose**: Identify security vulnerabilities

**Security Test Types**:
- OWASP Top 10 vulnerabilities
- SQL injection attempts
- XSS attack vectors
- CSRF protection
- Authentication bypass attempts
- Authorization escalation
- Dependency vulnerability scanning
- API security testing

**Tools**: OWASP ZAP, Bandit, Safety, npm audit

---

## Test Suite Architecture

### Directory Structure

#### Backend Test Structure
```
backend/backend/tests/
├── __init__.py
├── conftest.py                 # Shared fixtures and configuration
├── pytest.ini                  # Pytest configuration
│
├── unit/                       # Unit tests (55% of tests)
│   ├── __init__.py
│   ├── models/                 # Model tests (NEW)
│   │   ├── test_user_model.py
│   │   ├── test_pipeline_model.py
│   │   ├── test_connector_model.py
│   │   ├── test_transformation_model.py
│   │   ├── test_pipeline_run_model.py
│   │   └── test_relationships.py
│   │
│   ├── services/               # Service layer tests (EXPAND)
│   │   ├── test_permission_service.py      # ✅ EXISTS
│   │   ├── test_cleanup_service.py         # ✅ EXISTS
│   │   ├── test_pipeline_service.py        # NEW
│   │   ├── test_connector_service.py       # NEW
│   │   ├── test_transformation_service.py  # NEW
│   │   ├── test_analytics_service.py       # NEW
│   │   ├── test_schema_service.py          # NEW
│   │   ├── test_template_service.py        # NEW
│   │   ├── test_file_service.py            # NEW
│   │   ├── test_email_service.py           # NEW
│   │   ├── test_websocket_service.py       # NEW
│   │   └── test_execution_service.py       # NEW
│   │
│   ├── endpoints/              # Endpoint unit tests (EXPAND)
│   │   ├── test_analytics_endpoints.py     # ✅ EXISTS
│   │   ├── test_dashboard_endpoints.py     # ✅ EXISTS
│   │   ├── test_monitoring_endpoints.py    # ✅ EXISTS
│   │   ├── test_users_endpoints.py         # ✅ EXISTS
│   │   ├── test_pipeline_endpoints.py      # NEW
│   │   ├── test_connector_endpoints.py     # NEW
│   │   ├── test_transformation_endpoints.py # NEW
│   │   ├── test_template_endpoints.py      # NEW
│   │   ├── test_schema_endpoints.py        # NEW
│   │   └── test_file_endpoints.py          # NEW
│   │
│   ├── core/                   # Core utilities tests (NEW)
│   │   ├── test_security.py
│   │   ├── test_database.py
│   │   ├── test_config.py
│   │   ├── test_rbac.py
│   │   └── test_permissions.py
│   │
│   └── utils/                  # Utility tests (NEW)
│       ├── test_validators.py
│       ├── test_formatters.py
│       └── test_helpers.py
│
├── integration/                # Integration tests (25% of tests)
│   ├── __init__.py
│   ├── test_auth_flow.py              # ✅ EXISTS
│   ├── test_rbac_endpoints.py         # ✅ EXISTS
│   ├── test_pipeline_crud.py          # NEW
│   ├── test_connector_crud.py         # NEW
│   ├── test_transformation_crud.py    # NEW
│   ├── test_pipeline_execution.py     # NEW
│   ├── test_file_upload.py            # NEW
│   ├── test_websocket_integration.py  # NEW
│   ├── test_analytics_integration.py  # NEW
│   ├── test_database_operations.py    # NEW
│   ├── test_cache_integration.py      # NEW
│   └── test_event_publishing.py       # NEW
│
├── e2e/                        # End-to-end tests (IMPLEMENT)
│   ├── __init__.py
│   ├── test_user_journeys.py
│   ├── test_pipeline_lifecycle.py
│   ├── test_admin_workflows.py
│   └── test_data_processing.py
│
├── performance/                # Performance tests (NEW)
│   ├── __init__.py
│   ├── test_api_performance.py
│   ├── test_database_performance.py
│   ├── test_concurrent_users.py
│   └── load_tests/
│       └── locustfile.py
│
├── security/                   # Security tests (NEW)
│   ├── __init__.py
│   ├── test_sql_injection.py
│   ├── test_authentication.py
│   ├── test_authorization.py
│   └── test_input_validation.py
│
└── fixtures/                   # Test data and fixtures (NEW)
    ├── __init__.py
    ├── models.py               # Model factories
    ├── api_responses.py        # Mock API responses
    └── sample_data.py          # Sample datasets
```

#### Frontend Test Structure
```
frontend/
├── __tests__/                  # Unit tests (55% of tests)
│   ├── components/             # Component tests (EXPAND)
│   │   ├── ThemeToggle.test.tsx        # ✅ EXISTS
│   │   ├── layout/
│   │   │   ├── DashboardLayout.test.tsx    # NEW
│   │   │   ├── Header.test.tsx             # NEW
│   │   │   └── Sidebar.test.tsx            # NEW
│   │   ├── ui/
│   │   │   ├── Button.test.tsx             # NEW
│   │   │   ├── Card.test.tsx               # NEW
│   │   │   ├── Input.test.tsx              # NEW
│   │   │   ├── Modal.test.tsx              # NEW
│   │   │   └── DataTable.test.tsx          # NEW
│   │   ├── forms/
│   │   │   ├── ConnectorForm.test.tsx      # NEW
│   │   │   ├── PipelineForm.test.tsx       # NEW
│   │   │   ├── UserForm.test.tsx           # NEW
│   │   │   └── FormBuilder.test.tsx        # NEW
│   │   ├── charts/
│   │   │   ├── LineChart.test.tsx          # NEW
│   │   │   ├── BarChart.test.tsx           # NEW
│   │   │   └── PieChart.test.tsx           # NEW
│   │   ├── pipeline-builder/
│   │   │   ├── PipelineCanvas.test.tsx     # NEW
│   │   │   └── PipelineNode.test.tsx       # NEW
│   │   └── admin/
│   │       ├── UserManagement.test.tsx     # NEW
│   │       └── SystemMaintenance.test.tsx  # NEW
│   │
│   ├── hooks/                  # Hook tests (EXPAND)
│   │   ├── usePermissions.test.ts          # ✅ EXISTS
│   │   ├── useAuth.test.ts                 # NEW
│   │   ├── usePipelines.test.ts            # NEW
│   │   ├── useConnectors.test.ts           # NEW
│   │   ├── useWebSocket.test.ts            # NEW
│   │   ├── useForm.test.ts                 # NEW
│   │   └── useDataTable.test.ts            # NEW
│   │
│   ├── contexts/               # Context tests (EXPAND)
│   │   ├── ThemeContext.test.tsx           # ✅ EXISTS
│   │   ├── AuthContext.test.tsx            # NEW
│   │   └── WebSocketContext.test.tsx       # NEW
│   │
│   ├── pages/                  # Page component tests (NEW)
│   │   ├── Dashboard.test.tsx
│   │   ├── Pipelines.test.tsx
│   │   ├── Connectors.test.tsx
│   │   ├── Analytics.test.tsx
│   │   └── Users.test.tsx
│   │
│   ├── lib/                    # Library tests (NEW)
│   │   ├── api.test.ts
│   │   └── utils.test.ts
│   │
│   └── utils/                  # Test utilities
│       ├── test-utils.tsx              # ✅ EXISTS
│       ├── mocks.ts                    # ✅ EXISTS
│       └── factories.ts                # NEW - Test data factories
│
├── tests/e2e/                  # E2E tests (EXPAND)
│   ├── auth.spec.ts                    # ✅ EXISTS
│   ├── dashboard.spec.ts               # ✅ EXISTS (basic)
│   ├── rbac.spec.ts                    # ✅ EXISTS
│   ├── pipelines.spec.ts               # ✅ EXISTS (basic)
│   ├── users.spec.ts                   # ✅ EXISTS (basic)
│   ├── search.spec.ts                  # ✅ EXISTS (basic)
│   ├── accessibility.spec.ts           # ✅ EXISTS (basic)
│   ├── connectors.spec.ts              # NEW
│   ├── transformations.spec.ts         # NEW
│   ├── analytics.spec.ts               # NEW
│   ├── file-upload.spec.ts             # NEW
│   ├── real-time-updates.spec.ts       # NEW
│   ├── visual-pipeline-builder.spec.ts # NEW
│   ├── schema-mapping.spec.ts          # NEW
│   ├── error-handling.spec.ts          # NEW
│   │
│   ├── fixtures/               # Test data
│   │   └── test-data.ts                # ✅ EXISTS
│   │
│   └── utils/                  # E2E utilities
│       └── helpers.ts                  # ✅ EXISTS
│
├── tests/integration/          # Integration tests (NEW)
│   ├── api-integration.spec.ts
│   ├── form-submission.spec.ts
│   └── navigation.spec.ts
│
├── tests/performance/          # Performance tests (NEW)
│   ├── page-load.spec.ts
│   └── rendering.spec.ts
│
└── tests/visual/               # Visual regression tests (NEW)
    ├── components.spec.ts
    └── pages.spec.ts
```

### Test Naming Conventions

#### Backend
```python
# Unit tests
def test_<function_name>_<scenario>_<expected_result>():
    """Test description"""
    pass

# Examples:
def test_create_pipeline_with_valid_data_returns_201():
def test_delete_pipeline_as_viewer_returns_403():
def test_get_analytics_without_auth_returns_401():

# Integration tests
def test_integration_<workflow>_<scenario>():
    """Test description"""
    pass

# Examples:
def test_integration_pipeline_creation_and_execution():
def test_integration_file_upload_validation_and_storage():
```

#### Frontend
```typescript
// Unit tests
describe('ComponentName', () => {
  describe('when <scenario>', () => {
    it('should <expected behavior>', () => {
      // test
    });
  });
});

// Examples:
describe('PipelineForm', () => {
  describe('when submitting valid data', () => {
    it('should call onSubmit with form values', () => {});
  });

  describe('when validation fails', () => {
    it('should display error messages', () => {});
  });
});

// E2E tests
test('user can <perform action>', async ({ page }) => {
  // test
});

// Examples:
test('user can create and execute a pipeline', async ({ page }) => {});
test('admin can manage user roles', async ({ page }) => {});
```

### Test Data Management

#### Backend Test Data Strategy

**1. Factory Pattern (factory-boy)**
```python
# fixtures/models.py
import factory
from factory import fuzzy
from backend.models import User, Pipeline, Connector

class UserFactory(factory.Factory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    role = fuzzy.FuzzyChoice(['admin', 'developer', 'viewer'])
    is_active = True

class PipelineFactory(factory.Factory):
    class Meta:
        model = Pipeline

    name = factory.Sequence(lambda n: f"Pipeline {n}")
    description = factory.Faker('sentence')
    source_config = factory.Dict({
        'type': 'database',
        'host': 'localhost',
        'port': 5432
    })
    owner = factory.SubFactory(UserFactory)
```

**2. Fixture Data**
```python
# fixtures/sample_data.py
SAMPLE_USERS = [
    {'username': 'admin', 'role': 'admin', 'email': 'admin@example.com'},
    {'username': 'developer', 'role': 'developer', 'email': 'dev@example.com'},
    {'username': 'viewer', 'role': 'viewer', 'email': 'viewer@example.com'},
]

SAMPLE_PIPELINES = [
    {'name': 'Daily Sync', 'schedule': '0 0 * * *'},
    {'name': 'Hourly Update', 'schedule': '0 * * * *'},
]
```

**3. Database Seeding**
```python
# conftest.py
@pytest.fixture
async def seeded_db(test_session):
    """Database with sample data"""
    users = [UserFactory.build(**data) for data in SAMPLE_USERS]
    test_session.add_all(users)
    await test_session.commit()
    return test_session
```

#### Frontend Test Data Strategy

**1. Mock Service Worker (MSW)**
```typescript
// utils/mocks.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  rest.get('/api/pipelines', (req, res, ctx) => {
    return res(ctx.json({ pipelines: mockPipelines }));
  }),

  rest.post('/api/pipelines', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 1, ...req.body }));
  }),
];

export const server = setupServer(...handlers);
```

**2. Test Factories**
```typescript
// utils/factories.ts
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.number.int(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  role: 'viewer',
  ...overrides,
});

export const createMockPipeline = (overrides = {}) => ({
  id: faker.number.int(),
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  isActive: true,
  ...overrides,
});
```

**3. E2E Test Data**
```typescript
// tests/e2e/fixtures/test-data.ts (EXISTS - EXPAND)
export const TEST_USERS = {
  admin: { username: 'admin', password: 'password', role: 'admin' },
  developer: { username: 'dev', password: 'dev12345', role: 'developer' },
  viewer: { username: 'viewer', password: 'viewer123', role: 'viewer' },
};

export const TEST_PIPELINES = [
  { name: 'Test Pipeline 1', source: 'database', destination: 'api' },
  { name: 'Test Pipeline 2', source: 'api', destination: 'file' },
];
```

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
    python -m coverage combine
    python -m coverage html -d "$REPORTS_DIR/coverage/backend"
    python -m coverage json -o "$REPORTS_DIR/coverage/backend/coverage.json"

    # Frontend coverage
    cd "$PROJECT_ROOT/testing/frontend-tests"
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
          "cd $PROJECT_ROOT/backend && PYTHONPATH=\"$PROJECT_ROOT/backend:$PYTHONPATH\" python -m pytest ../testing/backend-tests/unit -v --cov=backend --cov-report=html:../testing/reports/coverage/backend-unit"; then
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
              "cd $PROJECT_ROOT/backend && PYTHONPATH=\"$PROJECT_ROOT/backend:$PYTHONPATH\" python -m pytest ../testing/backend-tests/integration -v --cov=backend --cov-append"; then
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
              "cd $PROJECT_ROOT/testing/frontend-tests && npm run test:unit"; then
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
              "cd $PROJECT_ROOT/testing/frontend-tests && npm run test:integration"; then
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
              "cd $PROJECT_ROOT/testing/frontend-tests && npm run test:e2e"; then
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
              "cd $PROJECT_ROOT/backend && PYTHONPATH=\"$PROJECT_ROOT/backend:$PYTHONPATH\" python -m pytest ../testing/backend-tests/performance -v"; then
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
              "cd $PROJECT_ROOT/backend && PYTHONPATH=\"$PROJECT_ROOT/backend:$PYTHONPATH\" python -m pytest ../testing/backend-tests/security -v && poetry run bandit -r backend/ && poetry run safety check"; then
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

## Implementation Roadmap

### Phase 1: Foundation & Critical Gaps (Weeks 1-4)

**Objective**: Establish testing infrastructure and close critical gaps

#### Week 1: Backend Critical Tests
**Priority**: HIGH | **Effort**: 40 hours

**Tasks**:
1. ✅ Review existing test structure (DONE)
2. Create model tests for all 13 models
   - User, Pipeline, Connector, Transformation models
   - Relationship tests
   - Constraint validation tests
   - **Deliverable**: `tests/unit/models/` with 6 test files

3. Implement CRUD integration tests
   - Pipeline CRUD operations
   - Connector CRUD operations
   - Transformation CRUD operations
   - **Deliverable**: `tests/integration/test_*_crud.py` (3 files)

4. Add service layer tests
   - Pipeline service (creation, validation, execution)
   - Connector service (configuration, testing)
   - Transformation service (rule execution)
   - **Deliverable**: `tests/unit/services/` (3 files)

**Success Criteria**:
- Backend coverage increases from 40% to 55%
- All models have > 80% test coverage
- CRUD operations fully tested

#### Week 2: Frontend Critical Tests
**Priority**: HIGH | **Effort**: 40 hours

**Tasks**:
1. Create page component tests
   - Dashboard, Pipelines, Connectors, Analytics, Users pages
   - **Deliverable**: `__tests__/pages/` with 5 test files

2. Implement form component tests
   - PipelineForm, ConnectorForm, UserForm
   - Form validation testing
   - **Deliverable**: `__tests__/components/forms/` (3 files)

3. Add hook tests for data management
   - usePipelines, useConnectors, useAuth
   - **Deliverable**: `__tests__/hooks/` (3 files)

4. Create UI component tests
   - Button, Input, Modal, Card components
   - **Deliverable**: `__tests__/components/ui/` (4 files)

**Success Criteria**:
- Frontend unit test coverage increases from 25% to 45%
- All page components have basic tests
- Form validation fully tested

#### Week 3: E2E Test Suite Implementation
**Priority**: HIGH | **Effort**: 40 hours

**Tasks**:
1. Expand existing E2E tests
   - Enhance dashboard.spec.ts (add 10+ tests)
   - Enhance pipelines.spec.ts (full CRUD workflow)
   - Enhance users.spec.ts (admin workflows)
   - **Deliverable**: Update 3 existing spec files

2. Create new E2E test suites
   - connectors.spec.ts (connector management)
   - analytics.spec.ts (analytics workflows)
   - file-upload.spec.ts (file handling)
   - **Deliverable**: 3 new spec files

3. Implement critical user journey tests
   - End-to-end pipeline creation and execution
   - User registration to pipeline creation
   - Admin user management workflow
   - **Deliverable**: `test_user_journeys.spec.ts`

**Success Criteria**:
- 50+ E2E tests covering all critical workflows
- All major user journeys tested
- < 5% flaky test rate

#### Week 4: Test Infrastructure & CI/CD
**Priority**: MEDIUM | **Effort**: 32 hours

**Tasks**:
1. Enhance test fixtures and factories
   - Backend: Factory-boy setup for all models
   - Frontend: MSW handlers for all API endpoints
   - **Deliverable**: `fixtures/` and `utils/factories.ts`

2. Configure test reporting
   - Coverage badges in README
   - HTML coverage reports
   - Test result summaries
   - **Deliverable**: Updated CI/CD configuration

3. Optimize test execution
   - Parallel test execution
   - Test grouping and tagging
   - Cache optimization
   - **Deliverable**: Faster test runs (< 10 mins)

4. Document testing practices
   - Testing guidelines
   - Writing test examples
   - Common patterns
   - **Deliverable**: `docs/TESTING_GUIDELINES.md`

**Success Criteria**:
- Test suite runs in < 10 minutes
- Coverage reports generated automatically
- Testing documentation complete

### Phase 2: Comprehensive Coverage (Weeks 5-8)

**Objective**: Achieve 80%+ coverage across all layers

#### Week 5-6: Backend Service & Endpoint Coverage
**Priority**: MEDIUM | **Effort**: 80 hours

**Tasks**:
1. Complete service layer tests (12 services)
   - Analytics, Schema, Template, File, Email services
   - WebSocket, Execution, Configuration services
   - **Deliverable**: 9 new service test files
   - **Target**: 80%+ coverage per service

2. Complete endpoint tests (15 endpoint modules)
   - Full request/response validation
   - Error scenario testing
   - Authentication/authorization checks
   - **Deliverable**: 6 new endpoint test files
   - **Target**: 90%+ endpoint coverage

3. Add core utility tests
   - Security utilities (hashing, encryption)
   - Database utilities (connections, migrations)
   - Configuration management
   - **Deliverable**: `tests/unit/core/` (5 files)

**Success Criteria**:
- Backend coverage reaches 75%
- All critical services > 80% coverage
- All endpoints have comprehensive tests

#### Week 7-8: Frontend Component & Hook Coverage
**Priority**: MEDIUM | **Effort**: 80 hours

**Tasks**:
1. Complete component test coverage (80+ components)
   - Layout components (Header, Sidebar, Footer)
   - Chart components (Line, Bar, Pie, Area)
   - Pipeline builder components
   - Admin components
   - **Deliverable**: 40+ component test files
   - **Target**: 70%+ component coverage

2. Complete hook test coverage (10+ hooks)
   - Data fetching hooks
   - Form hooks
   - WebSocket hooks
   - **Deliverable**: 7 new hook test files
   - **Target**: 80%+ hook coverage

3. Add integration tests
   - API integration tests
   - Form submission workflows
   - Navigation tests
   - **Deliverable**: `tests/integration/` (3 files)

4. Visual regression tests (optional)
   - Storybook integration
   - Visual snapshots
   - **Deliverable**: `tests/visual/` directory

**Success Criteria**:
- Frontend coverage reaches 70%
- All hooks have comprehensive tests
- Component tests cover user interactions

### Phase 3: Advanced Testing (Weeks 9-12)

**Objective**: Performance, security, and specialized testing

#### Week 9-10: Performance Testing
**Priority**: LOW | **Effort**: 60 hours

**Tasks**:
1. Backend performance tests
   - API endpoint performance benchmarks
   - Database query optimization tests
   - Concurrent request handling
   - **Tools**: Locust, pytest-benchmark
   - **Deliverable**: `tests/performance/` (4 files)

2. Frontend performance tests
   - Page load performance
   - Component rendering performance
   - Bundle size monitoring
   - **Tools**: Lighthouse CI, Playwright
   - **Deliverable**: `tests/performance/` (3 files)

3. Load testing infrastructure
   - Locust load test scripts
   - K6 test scenarios
   - Performance regression detection
   - **Deliverable**: `load_tests/` directory

**Success Criteria**:
- Performance baseline established
- Regression tests prevent slowdowns
- Load testing for 100+ concurrent users

#### Week 11: Security Testing
**Priority**: MEDIUM | **Effort**: 40 hours

**Tasks**:
1. OWASP Top 10 testing
   - SQL injection tests
   - XSS attack tests
   - CSRF protection tests
   - **Deliverable**: `tests/security/` (4 files)

2. Authentication/authorization security
   - Password strength validation
   - Token expiration tests
   - Role escalation attempts
   - **Deliverable**: `test_authentication.py`

3. Dependency vulnerability scanning
   - Automated security scanning (Bandit, Safety)
   - npm audit integration
   - **Deliverable**: CI/CD security checks

**Success Criteria**:
- Zero critical security vulnerabilities
- All OWASP Top 10 vectors tested
- Automated security scanning in CI/CD

#### Week 12: Test Optimization & Documentation
**Priority**: LOW | **Effort**: 32 hours

**Tasks**:
1. Test suite optimization
   - Identify and fix flaky tests
   - Optimize slow tests
   - Improve test isolation
   - **Target**: < 1% flaky rate, < 15 min total runtime

2. Comprehensive documentation
   - Testing best practices guide
   - Test writing examples
   - Troubleshooting guide
   - **Deliverable**: Complete testing documentation

3. Test maintenance automation
   - Automated test generation templates
   - Test coverage monitoring
   - Stale test identification
   - **Deliverable**: Test maintenance tools

**Success Criteria**:
- Test suite fully optimized
- Complete testing documentation
- Automated test maintenance

### Phase 4: Maintenance & Continuous Improvement (Ongoing)

**Objective**: Sustain quality and improve over time

**Activities**:
1. **Weekly**:
   - Review test coverage reports
   - Fix failing/flaky tests
   - Update tests for new features

2. **Monthly**:
   - Analyze test effectiveness (bug detection rate)
   - Identify untested code paths
   - Refactor outdated tests

3. **Quarterly**:
   - Update testing frameworks and tools
   - Review and update testing strategy
   - Conduct test suite audit

**Success Criteria**:
- Coverage maintained at 80%+
- < 1% flaky test rate
- 90%+ bug detection rate

---

## Testing Frameworks & Tools

### Current Tools (In Use)

#### Backend
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| pytest | 7.4.3 | Test framework | ✅ Active |
| pytest-asyncio | 0.21.1 | Async testing | ✅ Active |
| pytest-cov | 4.1.0 | Coverage reporting | ✅ Active |
| httpx | 0.25.2 | HTTP client | ✅ Active |
| factory-boy | 3.3.0 | Test data generation | ✅ Active |
| faker | 20.1.0 | Fake data | ✅ Active |

#### Frontend
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| Jest | 30.2.0 | Unit test framework | ✅ Active |
| @testing-library/react | 16.3.0 | Component testing | ✅ Active |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | ✅ Active |
| @testing-library/user-event | 14.6.1 | User interactions | ✅ Active |
| Playwright | 1.56.0 | E2E testing | ✅ Active |
| @axe-core/playwright | 4.10.2 | Accessibility | ✅ Active |

### Recommended Additional Tools

#### Backend Testing
| Tool | Purpose | Priority | Installation |
|------|---------|----------|--------------|
| pytest-benchmark | Performance testing | MEDIUM | `poetry add -D pytest-benchmark` |
| pytest-xdist | Parallel execution | HIGH | `poetry add -D pytest-xdist` |
| pytest-mock | Enhanced mocking | MEDIUM | `poetry add -D pytest-mock` |
| Locust | Load testing | MEDIUM | `poetry add -D locust` |
| Bandit | Security scanning | HIGH | `poetry add -D bandit` (EXISTS) |
| Safety | Dependency scanning | HIGH | `poetry add -D safety` |
| coverage[toml] | Enhanced coverage | LOW | `poetry add -D coverage[toml]` |

#### Frontend Testing
| Tool | Purpose | Priority | Installation |
|------|---------|----------|--------------|
| @storybook/react | Component development | LOW | `npm i -D @storybook/react` |
| @storybook/test-runner | Visual testing | LOW | `npm i -D @storybook/test-runner` |
| jest-axe | Accessibility testing | MEDIUM | `npm i -D jest-axe` |
| lighthouse-ci | Performance testing | MEDIUM | `npm i -D @lhci/cli` |
| K6 | Load testing | LOW | External tool |
| msw | API mocking | HIGH | `npm i -D msw` |

### Tool Configuration Examples

#### pytest Configuration (pytest.ini)
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --cov=backend
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    --asyncio-mode=auto
    --tb=short
    --strict-markers
    -v
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    e2e: marks tests as e2e tests
    security: marks tests as security tests
    performance: marks tests as performance tests
```

#### Jest Configuration (jest.config.js - ENHANCE)
```javascript
module.exports = {
  // ... existing config
  coverageThreshold: {
    global: {
      branches: 80,      // Increase from 70
      functions: 80,     // Increase from 70
      lines: 80,         // Increase from 70
      statements: 80,    // Increase from 70
    },
  },
  testTimeout: 10000,
  maxWorkers: '50%',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
};
```

#### Playwright Configuration (playwright.config.ts - ENHANCE)
```typescript
export default defineConfig({
  // ... existing config
  use: {
    trace: 'retain-on-failure',     // Enhanced tracing
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  retries: process.env.CI ? 2 : 1,  // Retry once locally
  workers: process.env.CI ? 2 : 4,  // More workers locally
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
});
```

---

## Quality Metrics & KPIs

### Coverage Metrics

#### Target Coverage Levels
| Layer | Current | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|-------|---------|---------------|---------------|---------------|
| **Backend** |
| Overall | 40% | 55% | 75% | 85% |
| Models | 0% | 80% | 85% | 90% |
| Services | 35% | 65% | 80% | 85% |
| Endpoints | 25% | 70% | 85% | 90% |
| Core Utils | 10% | 60% | 75% | 80% |
| **Frontend** |
| Overall | 25% | 45% | 70% | 80% |
| Components | 5% | 40% | 65% | 75% |
| Hooks | 20% | 60% | 80% | 85% |
| Pages | 0% | 50% | 70% | 75% |
| Utils | 15% | 70% | 80% | 85% |
| **E2E** |
| Critical Flows | 30% | 80% | 95% | 100% |
| User Journeys | 20% | 70% | 90% | 100% |

#### Coverage Calculation
```
Code Coverage = (Lines Executed / Total Lines) × 100

Branch Coverage = (Branches Executed / Total Branches) × 100

Function Coverage = (Functions Called / Total Functions) × 100

Statement Coverage = (Statements Executed / Total Statements) × 100
```

### Test Quality Metrics

#### 1. Test Effectiveness
**Formula**: `Bugs Detected by Tests / Total Bugs × 100`

**Targets**:
- Phase 1: 60% of bugs caught by tests
- Phase 2: 80% of bugs caught by tests
- Phase 3: 90% of bugs caught by tests

#### 2. Test Reliability (Flakiness Rate)
**Formula**: `Flaky Test Runs / Total Test Runs × 100`

**Targets**:
- Phase 1: < 5% flaky rate
- Phase 2: < 2% flaky rate
- Phase 3: < 1% flaky rate

#### 3. Test Execution Time
**Measurement**: Total time for full test suite

**Targets**:
- Phase 1: < 15 minutes
- Phase 2: < 12 minutes
- Phase 3: < 10 minutes

#### 4. Test Maintenance Burden
**Formula**: `Test Update Time / Feature Development Time × 100`

**Targets**:
- Phase 1: < 30%
- Phase 2: < 25%
- Phase 3: < 20%

### Performance Metrics

#### API Performance Benchmarks
| Endpoint Category | P50 | P95 | P99 | Target |
|------------------|-----|-----|-----|--------|
| CRUD Operations | 100ms | 200ms | 500ms | < 200ms (P95) |
| Analytics Queries | 500ms | 1s | 2s | < 1s (P95) |
| File Upload | 1s | 3s | 5s | < 3s (P95) |
| WebSocket | 50ms | 100ms | 200ms | < 100ms (P95) |

#### Frontend Performance Benchmarks
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| First Contentful Paint | TBD | < 1.8s | Lighthouse |
| Largest Contentful Paint | TBD | < 2.5s | Lighthouse |
| Time to Interactive | TBD | < 3.8s | Lighthouse |
| Total Blocking Time | TBD | < 200ms | Lighthouse |
| Cumulative Layout Shift | TBD | < 0.1 | Lighthouse |

### Security Metrics

#### Vulnerability Tracking
| Severity | Allowed Count | Current | Action |
|----------|--------------|---------|--------|
| Critical | 0 | TBD | Block deployment |
| High | 0 | TBD | Fix before release |
| Medium | < 5 | TBD | Track and plan fix |
| Low | < 20 | TBD | Backlog |

#### Security Test Coverage
- OWASP Top 10: 100% coverage target
- Authentication vectors: 100% coverage target
- Authorization vectors: 100% coverage target
- Input validation: 90% coverage target

### CI/CD Metrics

#### Build Pipeline Success Rate
**Formula**: `Successful Builds / Total Builds × 100`

**Targets**:
- Phase 1: > 85%
- Phase 2: > 90%
- Phase 3: > 95%

#### Test Pass Rate
**Formula**: `Passing Tests / Total Tests × 100`

**Targets**: > 98% (allowing for < 2% known issues)

#### Deployment Frequency
**Measurement**: Deployments per week

**Targets**:
- Phase 1: 2-3 deployments/week
- Phase 2: 3-5 deployments/week
- Phase 3: Daily deployments

### Reporting & Dashboards

#### Weekly Test Report
```
# Weekly Test Report - Week XX

## Coverage Summary
- Backend: XX% (Target: YY%)
- Frontend: XX% (Target: YY%)
- E2E: XX critical flows covered

## Test Execution
- Total Tests: XXX
- Passed: XXX (XX%)
- Failed: XX (XX%)
- Flaky: XX (XX%)
- Duration: XX minutes

## Quality Metrics
- Bugs Detected by Tests: XX/YY (XX%)
- New Tests Added: XX
- Test Debt: XX issues

## Action Items
1. [Action item 1]
2. [Action item 2]
```

#### Coverage Dashboard (HTML Report)
- Line coverage by file/directory
- Branch coverage visualization
- Uncovered lines highlighting
- Coverage trends over time

#### CI/CD Dashboard
- Build success rate
- Test pass rate
- Deployment frequency
- Performance trends

---

## Appendix

### A. Test Writing Guidelines

#### Unit Test Best Practices

**1. Test One Thing**
```python
# Good
def test_create_pipeline_with_valid_data_returns_pipeline():
    pipeline = create_pipeline({'name': 'Test', 'source': 'db'})
    assert pipeline.name == 'Test'

# Bad - Testing multiple things
def test_pipeline_operations():
    pipeline = create_pipeline({'name': 'Test'})
    assert pipeline.name == 'Test'
    pipeline.update({'name': 'Updated'})
    assert pipeline.name == 'Updated'
    pipeline.delete()
    assert pipeline.deleted_at is not None
```

**2. Use Descriptive Names**
```python
# Good
def test_delete_pipeline_as_viewer_role_returns_403_forbidden():
    pass

# Bad
def test_delete_pipeline():
    pass
```

**3. Follow AAA Pattern**
```python
def test_create_user_with_duplicate_email_raises_error():
    # Arrange
    existing_user = UserFactory(email='test@example.com')

    # Act & Assert
    with pytest.raises(ValidationError):
        create_user({'email': 'test@example.com'})
```

**4. Test Edge Cases**
```python
def test_division_by_zero_raises_error():
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_empty_list_returns_none():
    result = find_max([])
    assert result is None

def test_null_input_handled_gracefully():
    result = process_data(None)
    assert result == []
```

#### Integration Test Best Practices

**1. Use Realistic Data**
```python
@pytest.mark.integration
async def test_pipeline_execution_end_to_end(test_client, test_session):
    # Create realistic pipeline
    pipeline_data = {
        'name': 'Customer Data Sync',
        'source_config': {
            'type': 'database',
            'host': 'localhost',
            'database': 'customers'
        },
        'destination_config': {
            'type': 'api',
            'url': 'https://api.example.com/customers'
        }
    }

    # Execute full workflow
    response = await test_client.post('/api/pipelines', json=pipeline_data)
    pipeline_id = response.json()['id']

    execute_response = await test_client.post(f'/api/pipelines/{pipeline_id}/execute')
    assert execute_response.status_code == 200
```

**2. Clean Up After Tests**
```python
@pytest.fixture
async def test_pipeline(test_session):
    pipeline = PipelineFactory()
    test_session.add(pipeline)
    await test_session.commit()

    yield pipeline

    # Cleanup
    await test_session.delete(pipeline)
    await test_session.commit()
```

#### E2E Test Best Practices

**1. Use Page Object Pattern**
```typescript
// pages/PipelinePage.ts
class PipelinePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/pipelines');
  }

  async createPipeline(name: string) {
    await this.page.click('[data-testid="create-pipeline-btn"]');
    await this.page.fill('[name="name"]', name);
    await this.page.click('[type="submit"]');
  }

  async getPipelineByName(name: string) {
    return this.page.locator(`text=${name}`);
  }
}

// Usage in test
test('create pipeline', async ({ page }) => {
  const pipelinePage = new PipelinePage(page);
  await pipelinePage.goto();
  await pipelinePage.createPipeline('Test Pipeline');
  await expect(pipelinePage.getPipelineByName('Test Pipeline')).toBeVisible();
});
```

**2. Use data-testid Attributes**
```tsx
// Component
<button data-testid="submit-btn" onClick={handleSubmit}>
  Submit
</button>

// Test
await page.click('[data-testid="submit-btn"]');
```

**3. Wait for Elements Properly**
```typescript
// Good - Wait for specific condition
await page.waitForSelector('[data-testid="success-message"]');
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

// Bad - Arbitrary wait
await page.waitForTimeout(3000);
```

### B. Common Testing Patterns

#### Mocking External Services
```python
# Backend - Mock external API
from unittest.mock import patch, MagicMock

@patch('requests.get')
def test_fetch_data_from_external_api(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {'data': 'test'}
    mock_get.return_value = mock_response

    result = fetch_external_data()
    assert result == {'data': 'test'}
```

```typescript
// Frontend - Mock API with MSW
import { rest } from 'msw';
import { server } from './mocks';

test('fetch pipelines', async () => {
  server.use(
    rest.get('/api/pipelines', (req, res, ctx) => {
      return res(ctx.json({ pipelines: [{ id: 1, name: 'Test' }] }));
    })
  );

  const { result } = renderHook(() => usePipelines());
  await waitFor(() => expect(result.current.pipelines).toHaveLength(1));
});
```

#### Testing Async Operations
```python
# Backend
@pytest.mark.asyncio
async def test_async_pipeline_execution():
    result = await execute_pipeline_async(pipeline_id=1)
    assert result.status == 'completed'
```

```typescript
// Frontend
test('async data fetch', async () => {
  const { result } = renderHook(() => useAsyncData());

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

#### Testing Error Scenarios
```python
def test_invalid_pipeline_config_raises_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        create_pipeline({'name': ''})  # Empty name

    assert 'name' in str(exc_info.value)
```

```typescript
test('displays error message on API failure', async () => {
  server.use(
    rest.post('/api/pipelines', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<PipelineForm />);

  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });
});
```

### C. Troubleshooting Guide

#### Common Issues

**1. Flaky Tests**
```
Problem: Tests pass sometimes, fail other times

Solutions:
- Remove arbitrary waits (sleep, waitForTimeout)
- Use proper wait conditions (waitFor, waitForSelector)
- Ensure test data isolation
- Check for race conditions
- Use fixtures to reset state
```

**2. Slow Tests**
```
Problem: Test suite takes too long

Solutions:
- Run tests in parallel (pytest-xdist, Playwright workers)
- Use database transactions instead of full cleanup
- Mock external services
- Optimize fixture scope
- Use pytest markers to skip slow tests during development
```

**3. Database Connection Issues**
```
Problem: Tests fail with database errors

Solutions:
- Use in-memory SQLite for unit tests
- Ensure proper database cleanup
- Check fixture scopes (session vs function)
- Use database transactions for isolation
```

**4. Import Errors**
```
Problem: Module not found errors

Solutions:
- Add __init__.py to test directories
- Check PYTHONPATH configuration
- Verify test discovery patterns in pytest.ini
```

### D. Resources & References

#### Documentation
- [pytest Documentation](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Factory Boy](https://factoryboy.readthedocs.io/)

#### Testing Philosophy
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [FIRST Principles](https://github.com/tekguard/Principles-of-Unit-Testing)

#### Best Practices
- [Arrange-Act-Assert Pattern](http://wiki.c2.com/?ArrangeActAssert)
- [Test Doubles](https://martinfowler.com/bliki/TestDouble.html)
- [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html)

---

## Summary

This comprehensive automated test suite plan provides a clear roadmap to elevate the Data Aggregator Platform's testing from 40% backend and 25% frontend coverage to 85% and 80% respectively. The plan is structured in 4 phases over 12 weeks, with clear deliverables, success criteria, and quality metrics.

**Key Achievements**:
- **Current State**: 19 test files, 291 test cases, 40% backend / 25% frontend coverage
- **Target State**: 200+ test files, 1,500+ test cases, 85% backend / 80% frontend coverage
- **Timeline**: 12 weeks to comprehensive coverage + ongoing maintenance
- **Investment**: ~352 hours of focused testing effort

**Next Steps**:
1. Review and approve this plan
2. Allocate resources (developers, QA engineers)
3. Begin Phase 1: Foundation & Critical Gaps (Week 1)
4. Establish weekly test metrics review
5. Integrate into sprint planning

This plan ensures that the Data Aggregator Platform meets production-quality standards with robust, reliable, and maintainable automated testing across all layers.

---

**Document Version**: 1.0
**Status**: Ready for Implementation
**Approval Required**: Engineering Lead, QA Lead, Product Owner
