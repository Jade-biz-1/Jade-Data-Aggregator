# Testing Guide

Data Aggregator Platform

**Last updated:** November 17, 2025

---

## 🎯 Purpose

This guide explains how to execute, monitor, and extend the automated test suites that protect the Data Aggregator Platform. It complements the broader strategy laid out in `docs/AUTOMATED_TEST_SUITE_PLAN.md` and the implementation roadmap in `TasksTracking/testing-implementation-tasks.md`.

---

## 🧱 Test Architecture Overview

| Stage | Tooling | Command | Notes |
|-------|---------|---------|-------|
| Backend Unit | `pytest`, `pytest-cov`, `sqlalchemy` mocks | `./testing/scripts/run-tests.sh --stage backend_unit` | Fast feedback for services, models, utilities |
| Backend Integration | `pytest`, async fixtures, ephemeral Postgres | `./testing/scripts/run-tests.sh --stage backend_integration` | Requires Docker test stack |
| Frontend Unit | Jest + React Testing Library | `./testing/scripts/run-tests.sh --stage frontend_unit` | Runs in Node 18 environment |
| Frontend Integration | Playwright component tests | `./testing/scripts/run-tests.sh --stage frontend_integration` | Shares mocks with frontend unit stage |
| End-to-End | Playwright E2E | `./testing/scripts/run-tests.sh --stage e2e` | Spins up full stack via Docker Compose |
| Performance | Locust / custom scripts | `./testing/scripts/run-tests.sh --stage performance` | Generates CSV metrics in `testing/reports/performance` |
| Security | OWASP ZAP CLI, dependency scanners | `./testing/scripts/run-tests.sh --stage security` | Requires ZAP proxy container |

> ℹ️ The orchestrator script enforces dependency ordering when run without the `--stage` flag. For example, backend unit tests must succeed before backend integration tests execute.

---

## 🚀 Quick Start

```bash
# Install backend test dependencies
pip install -r testing/backend-tests/requirements.txt

# Install frontend test dependencies
npm install --prefix testing/frontend-tests

# Verify host requirements (Docker, Python 3.10, Node 18, Poetry)
./testing/scripts/check-prerequisites.sh

# Provision the isolated test environment
./testing/scripts/setup-test-env.sh

# Run the full suite with fail-fast enabled
./testing/scripts/run-tests.sh

# Tear down the environment when finished
./testing/scripts/teardown-test-env.sh
```

### Useful Flags

- `--stage STAGE_NAME` – run a single stage (see table above)
- `--no-fail-fast` – continue executing later stages even if an earlier one fails
- `--capture-all` – force comprehensive artifact capture (screenshots, videos, logs)

Artifacts are written under `testing/reports/` with sub-folders for logs, coverage, screenshots, and videos. The summary script (`testing/scripts/generate_summary.py`) reads these artifacts to produce a CLI report.

---

## 🛠️ Adding New Tests

### Backend

1. Create the test module under `testing/backend-tests/<scope>/` (e.g. `unit/services`).
2. Name the file `test_<feature>.py` and functions `test_<behaviour>()` to align with `pytest.ini` discovery rules.
3. Use `pytest.mark.asyncio` for async functions and prefer `pytest` fixtures over manual setup.
4. Mock external resources (databases, S3, Redis) to keep unit tests deterministic.

Run backend tests with `python -m pytest ../testing/backend-tests/<scope>/` from the `backend` directory so the `backend` package stays on the import path.

### Frontend

1. Place unit tests in `testing/frontend-tests/unit/` mirroring the component path (e.g. `components/forms/`).
2. Use React Testing Library idioms (`screen`, `userEvent`) and avoid implementation details.
3. For integration/E2E, add Playwright specs under `testing/frontend-tests/e2e/` and update `playwright.config.ts` if new projects are introduced.

Run frontend tests with `npm run test:unit` from the `testing/frontend-tests` directory (or prefix the command with `npm --prefix testing/frontend-tests`).

### Test Data & Fixtures

- Shared backend fixtures live in `testing/backend-tests/fixtures/`.
- Frontend mocks reside in `testing/frontend-tests/unit/__mocks__/`.
- For integration tests that need seed data, re-use the factories in `backend/scripts/seed_test_data.py`.

## 📈 Coverage Expectations

- Backend stages enforce `--cov-fail-under=80` (see `backend/pytest.ini`).
- Jest produces `coverage/coverage-summary.json`; the orchestrator copies summaries into `testing/reports/coverage/`.
- Use `python -m pytest ../testing/backend-tests/unit --cov backend --cov-report=term-missing` locally if you need a quick diff.

> ✅ Remember to update or add tests whenever new endpoints, services, or UI flows are introduced. Pull requests that decrease coverage or bypass mandatory stages should be rejected.

---

## 🔍 Troubleshooting

- **Environment mismatch** – rerun `setup-test-env.sh` to refresh containers and dependencies.
- **Coverage threshold failing** – run the failing stage directly and inspect `testing/reports/logs/<stage>.log` for missing branches.
- **Playwright hangs** – ensure no local services are already bound to required ports (`3000`, `8001`).
- **Security tooling unavailable** – install OWASP ZAP via Docker (`docker pull owasp/zap2docker-stable`) before triggering the security stage.

---

## 📚 Related References

- `docs/AUTOMATED_TEST_SUITE_PLAN.md`
- `TasksTracking/testing-implementation-tasks.md`
- `docs/troubleshooting.md`
- `testing/README.md`

Need help? Ping the QA Slack channel (#qa-automation) with the failing stage, log snippet, and the command you executed.
