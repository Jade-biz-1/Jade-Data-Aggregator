# Phase 13: Frontend Test Suite Expansion

Extend test coverage to Phase 12 pages and key E2E flows that have no automated tests.
All Phase 12 pages (FRONT-001 to FRONT-012) were added without unit or E2E tests; this phase closes that gap.

**Status:** ✅ Complete | **Branch:** RunAndFix

---

## Scope

| ID | Test File | Target Page | Client |
|----|-----------|-------------|--------|
| TEST-015 | `unit/pages/alerts.test.tsx` | `app/alerts/page.tsx` (FRONT-001) | `apiClient.fetch` |
| TEST-016 | `unit/pages/analytics.test.tsx` | `app/analytics/page.tsx` (FRONT-004) | `apiClient` named methods |
| TEST-017 | `unit/pages/search.test.tsx` | `app/search/page.tsx` (FRONT-011) | `api` axios |
| TEST-018 | `unit/pages/schema-introspect.test.tsx` | `app/schema/introspect/page.tsx` (FRONT-012) | `api` axios |
| TEST-019 | `e2e/alerts.spec.ts` | Alerts list + acknowledge + create rule | Playwright |
| TEST-020 | `e2e/analytics.spec.ts` | Analytics dashboard + time range + export | Playwright |

---

## Progress

| ID | Description | Status |
|----|-------------|--------|
| TEST-015 | Alerts page unit tests | `[x]` Complete — `testing/frontend-tests/unit/pages/alerts.test.tsx`; mocks `apiClient.fetch`/`apiClient.post`; covers permissions, loading, data display, filtering, acknowledge action, error handling, empty state |
| TEST-016 | Analytics page unit tests | `[x]` Complete — `testing/frontend-tests/unit/pages/analytics.test.tsx`; mocks `apiClient.getAnalyticsData`/`getTimeSeriesData`/`getTopPipelines`; covers permissions, data fetch, KPI display, charts, top pipelines, time range, empty state |
| TEST-017 | Search page unit tests | `[x]` Complete — `testing/frontend-tests/unit/pages/search.test.tsx`; mocks `api.get`; covers permissions, search execution (button + Enter), result display, suggestions debounce, localStorage history/saved searches |
| TEST-018 | Schema introspect page unit tests | `[x]` Complete — `testing/frontend-tests/unit/pages/schema-introspect.test.tsx`; mocks `api.get`/`api.post`; covers source type switching, introspect DB/JSON, save schema modal, compare panel, comparison results, saved schemas panel |
| TEST-019 | Alerts E2E spec | `[x]` Complete — `testing/frontend-tests/e2e/alerts.spec.ts`; covers alert page render, filters, acknowledge, rules nav, history nav, access control for viewer; Alert Rules sub-suite covers list + create button |
| TEST-020 | Analytics E2E spec | `[x]` Complete — `testing/frontend-tests/e2e/analytics.spec.ts`; covers page render, KPI cards, charts, time range selector, top pipelines, export button, developer/viewer access control, advanced analytics route |

---
