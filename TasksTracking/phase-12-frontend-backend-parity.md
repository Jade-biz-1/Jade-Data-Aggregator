# Phase 12: Frontend–Backend Parity

Close the gap between the 100%-complete backend (212 endpoints, 26 routers) and the ~60%-complete frontend UI. All backend APIs exist and are functional; this phase is purely frontend implementation work.

**Status:** 🟡 In Progress | **Branch:** RunAndFix | **Source:** `frontend-gap-analysis.md` (Nov 4, 2025)

| Milestone | Frontend Coverage | Target |
|-----------|------------------|--------|
| Start of Phase 12 | ~60% | — |
| After Sub-phase 12A | ~75% | — |
| After Sub-phase 12B | ~90% | — |
| After Sub-phase 12C | 100% | ✅ |

---

## Sub-Phase 12A: Critical Features 🔴 HIGH PRIORITY

> Enables essential Admin, Developer, Executor, and Executive functionality that is currently completely missing.

---

### FRONT-001 — Alert Management System

**Status:** `[x]` Complete

**Pages to create:**
- [ ] `app/alerts/page.tsx` — Alert dashboard (active alerts, stats summary)
- [ ] `app/alerts/rules/page.tsx` — Alert rules management (list, create, edit, delete)
- [ ] `app/alerts/history/page.tsx` — Alert history viewer

**Components to build:**
- [ ] `components/alerts/AlertRuleForm.tsx` — Create/edit alert rule modal
- [ ] `components/alerts/AlertList.tsx` — Active alert cards with severity badges
- [ ] `components/alerts/AlertHistoryTable.tsx` — Paginated historical alerts
- [ ] `components/alerts/EscalationPolicyForm.tsx` — Escalation chain configuration
- [ ] `components/alerts/AlertStatistics.tsx` — Metrics dashboard (fired, acknowledged, MTTR)

**Backend endpoints to integrate:**
- [ ] `POST   /api/v1/alerts/rules` — Create alert rule
- [ ] `GET    /api/v1/alerts/rules` — List rules
- [ ] `PUT    /api/v1/alerts/rules/{id}` — Update rule
- [ ] `DELETE /api/v1/alerts/rules/{id}` — Delete rule
- [ ] `GET    /api/v1/alerts/active` — Active alerts
- [ ] `POST   /api/v1/alerts/{id}/acknowledge` — Acknowledge alert
- [ ] `GET    /api/v1/alerts/history` — Alert history
- [ ] `GET    /api/v1/alerts/statistics` — Alert stats

**Roles affected:** Admin 🔴, Developer 🔴

---

### FRONT-002 — WebSocket Real-time Integration

**Status:** `[x]` Complete

**Services / hooks to create:**
- [x] `src/services/websocket.ts` — WebSocket manager (connect, reconnect, auth, teardown) — fixed singleton URLs to `/api/v1/ws`
- [x] `src/hooks/useWebSocket.ts` — React hook wrapping the manager (already existed)
- [x] `src/hooks/useRealTimeMetrics.ts` — system metrics hook (already existed)
- [x] `src/hooks/useRealTimePipelineStatus.ts` — pipeline status hook (already existed)
- [x] `src/hooks/useRealTimeNotifications.ts` — notifications hook (already existed)

**Pages / components to update:**
- [x] `app/monitoring/live/page.tsx` — Already wired to WS hooks
- [x] `app/monitoring/performance/page.tsx` — Added live CPU/Memory/Disk panel + WS indicator
- [x] `app/dashboard/page.tsx` — Already had real-time widgets
- [x] `app/pipelines/page.tsx` — WS pipeline_status messages update status badges + Live indicator

**Backend WebSocket endpoints integrated:**
- [x] `WS /api/v1/ws` — Shared endpoint; delivers `system_metrics`, `system_alert`, `pipeline_status`, `pipeline_progress`, `pipeline_log`, `pipeline_error` message types
- [x] `WS /api/v1/ws/pipeline/{id}` — Per-pipeline subscription endpoint

**Roles affected:** Developer 🔴, Executor 🔴, Admin 🟡

---

### FRONT-003 — Execution History Viewer

**Status:** `[x]` Complete

**Pages:**
- [x] `app/pipelines/[id]/executions/page.tsx` — Existed; fixed ToastContainer, response parsing, stats parsing
- [x] `app/pipelines/[id]/executions/[runId]/page.tsx` — Existed; fixed ToastContainer, response parsing, logs shape

**Backend fixes & additions:**
- [x] Fixed `CRUDPipelineRun` — replaced `self.model` (undefined) with `PipelineRun` in 4 query methods
- [x] Added `PipelineRunResponse` schema with `duration_seconds`, `pipeline_name`, `trigger_type`, `steps`
- [x] Added `PipelineExecutor.retry_run()` — clones a failed/cancelled run into a fresh execution
- [x] Fixed route paths: `GET/POST /runs/{run_id}` → `/{pipeline_id}/runs/{run_id}` (matching frontend calls)
- [x] `GET  /api/v1/pipelines/{id}/runs` — now accepts `days` + `status` filters; returns `PipelineRunResponse`
- [x] `GET  /api/v1/pipelines/{id}/runs/{runId}` — fixed path; returns detail with `pipeline_name` + `steps: []`
- [x] `GET  /api/v1/pipelines/{id}/runs/{runId}/logs` — NEW; parses `run.logs` text into structured `LogEntry[]`
- [x] `GET  /api/v1/pipelines/{id}/runs/{runId}/logs/export` — NEW; plain-text download
- [x] `POST /api/v1/pipelines/{id}/runs/{runId}/retry` — NEW; delegates to `retry_run()`
- [x] `POST /api/v1/pipelines/{id}/runs/{runId}/cancel` — fixed path
- [x] `GET  /api/v1/pipelines/{id}/runs/statistics` — NEW; total/successful/failed/avg_duration/success_rate
- [x] `GET  /api/v1/pipelines/{id}/runs/export` — NEW; CSV export with `days`/`status` filters

**Roles affected:** Executor 🔴, Developer 🔴, Admin 🟡

---

### FRONT-004 — Advanced Analytics Implementation

**Status:** `[x]` Complete

**Pages:**
- [x] `app/analytics/advanced/page.tsx` — Existed as partial stub; fully wired and fixed

**Existing chart components (already present, now used correctly):**
- [x] `components/charts/trend-chart.tsx` — TrendChart (records + success rate)
- [x] `components/charts/comparative-chart.tsx` — ComparativeChart (wired via comparative-analytics endpoint)
- [x] `components/charts/predictive-indicator.tsx` — PredictiveIndicator (wired)
- [x] `components/charts/line-chart.tsx` — LineChart (time-series)

**Backend fixes & integrations:**
- [x] Fixed export endpoint: replaced non-existent `generate_export_content()` with `ExportService.export_to_csv()` / `export_to_json()` — returns `{content, mime_type, filename}`
- [x] `POST /api/v1/analytics/advanced/time-series` — fixed: was called with GET; now uses POST + query params
- [x] `POST /api/v1/analytics/advanced/trend-analysis` — fixed: metric now sent as query param, `{start,end}` as body
- [x] `GET  /api/v1/analytics/advanced/predictive-indicators` — fixed response parsing
- [x] `POST /api/v1/analytics/advanced/export` — fixed backend + frontend response parsing for file download
- [x] `POST /api/v1/analytics/advanced/comparative-analytics` — wired; uses pipeline list to auto-populate IDs
- [x] `POST /api/v1/analytics/advanced/reports/generate` — all 3 report types wired; downloads result as JSON

**Roles affected:** Executive 🔴, Admin 🔴

---

## Sub-Phase 12B: Essential Tools 🟡 MEDIUM PRIORITY

> Improves debugging efficiency, production safety, and designer productivity.

---

### FRONT-005 — Log Analysis Interface

**Status:** `[x]` Complete

**Pages to create:**
- [x] `app/logs/page.tsx` — Existed; fixed ToastContainer, response parsing, correlation URL, export
- [ ] `app/logs/correlations/[id]/page.tsx` — Not needed; correlation trace handled inline via modal

**Components to build:**
- [x] `components/logs/LogViewer.tsx` — Handled inline in `logs/page.tsx`
- [x] `components/logs/LogSearchForm.tsx` — Handled inline in `logs/page.tsx`
- [x] `components/logs/LogFilterPanel.tsx` — Handled inline in `logs/page.tsx`
- [x] `components/logs/CorrelationTracker.tsx` — Handled inline via correlation ID search
- [ ] `components/logs/ErrorTrendChart.tsx` — Out of scope (no error trends in existing page)
- [x] `components/logs/LogStatistics.tsx` — Statistics cards in `logs/page.tsx`

**Backend endpoints to integrate:**
- [x] `GET  /api/v1/logs` — Added; wraps `POST /search`; maps component→source, extra_data→details; computes flat statistics
- [x] `GET  /api/v1/logs/correlation/{id}` — Existed; frontend fixed to use path param
- [x] `GET  /api/v1/logs/statistics` — Exists; computed inline in `GET /logs` response
- [ ] `GET  /api/v1/logs/errors/trends` — Exists but not wired to frontend (no UI for it)
- [x] `GET  /api/v1/logs/export` — Added; CSV StreamingResponse; frontend uses responseType: 'blob'

**Roles affected:** Developer 🔴, Admin 🟡

---

### FRONT-006 — Pipeline Versioning UI

**Status:** `[x]` Complete

**Pages to create:**
- [x] `app/pipelines/[id]/versions/page.tsx` — Existed; fixed URL prefix, response parsing, field mapping, compare, rollback, tag, handleViewConfig
- [ ] `app/pipelines/[id]/versions/compare/page.tsx` — Not needed; diff view handled inline in side panel

**Components to build:**
- [x] `components/versioning/VersionHistoryTable.tsx` — Handled inline in `versions/page.tsx`
- [x] `components/versioning/VersionDiffViewer.tsx` — `renderDiff()` inline; transforms backend differences format
- [x] `components/versioning/VersionRollbackModal.tsx` — `confirm()` dialog inline; calls `/restore`
- [x] `components/versioning/VersionTagForm.tsx` — `prompt()` inline; stores tag in `version_name`
- [ ] `components/versioning/VersionTimelineView.tsx` — Out of scope (existing list layout sufficient)

**Backend endpoints to integrate:**
- [x] `GET  /api/v1/pipeline-versions/pipelines/{id}/versions` — Existed; frontend URL prefix fixed
- [x] `GET  /api/v1/pipeline-versions/versions/{versionId}` — Existed; fetched on "View Config" click
- [x] `POST /api/v1/pipeline-versions/versions/{versionId}/activate` — Existed (not wired to UI; rollback/restore covers this)
- [x] `GET  /api/v1/pipeline-versions/versions/{v1}/compare/{v2}` — Existed; frontend fixed to path params; response shape transformed
- [x] `POST /api/v1/pipeline-versions/pipelines/{id}/versions/{versionId}/tag` — Added; stores tag in `version_name`

**Roles affected:** Developer 🔴, Designer 🟡

---

### FRONT-007 — System Cleanup UI

**Status:** `[x]` Complete

**Pages to enhance:**
- [x] `app/admin/maintenance/page.tsx` — Existed (1006 lines); fixed ToastContainer, schedule field mapping, cleanupResults guards

**Components to build:**
- [x] `components/admin/CleanupOperationsPanel.tsx` — Handled inline; 4 operation buttons + Run All with ConfirmDialog
- [x] `components/admin/CleanupStatistics.tsx` — Stats cards + PieChart + BarChart inline
- [x] `components/admin/CleanupHistoryTable.tsx` — History tab inline; backend is placeholder (returns []) — displays empty state correctly
- [x] `components/admin/CleanupScheduler.tsx` — Schedule tab inline; fixed field mapping with cronToScheduleType/scheduleTypeToCron helpers
- [x] `components/admin/DiskSpaceMetrics.tsx` — Database Size card + record distribution chart inline

**Backend endpoints to integrate:**
- [x] `POST /api/v1/admin/cleanup/activity-logs` — Existed; frontend uses raw fetch (correct full path)
- [x] `POST /api/v1/admin/cleanup/orphaned-data` — Existed; wired
- [x] `POST /api/v1/admin/cleanup/temp-files` — Existed; wired
- [x] `POST /api/v1/admin/cleanup/execution-logs` — Existed; wired
- [x] `POST /api/v1/admin/cleanup/database-vacuum` — Existed; wired
- [x] `POST /api/v1/admin/cleanup/expired-sessions` — Existed (note: backend path is /expired-sessions not /sessions); wired
- [x] `POST /api/v1/admin/cleanup/all` — Existed; adds duration_seconds in admin endpoint wrapper
- [x] `GET  /api/v1/admin/cleanup/stats` — Existed (note: path is /stats not /statistics); wired
- [x] `GET  /api/v1/admin/cleanup/history` — Existed but is placeholder; returns [] — handled gracefully with empty state UI

**Roles affected:** Admin 🔴

---

### FRONT-008 — Transformation Function Library

**Status:** `[x]` Complete

**Pages to create:**
- [x] `app/transformations/functions/page.tsx` — Existed; fixed URL prefix (`/transformation-functions`), removed `.data` wrapper, mapped `use_count`→`usage_count`, added `handleSelectFunction()` for two-step list+detail fetch, fixed test endpoint (`test_input` param), fixed `ToastContainer toasts={toasts}`
- [x] `app/transformations/functions/[id]/page.tsx` — Created; full detail page with parameters, code, example input/output, test panel, usage stats panel

**Components to build:**
- [x] `components/functions/FunctionCatalog.tsx` — Handled inline in `functions/page.tsx` (search + category filter + list)
- [x] `components/functions/FunctionCategoryFilter.tsx` — Handled inline; `<select>` with dynamic categories from loaded functions
- [x] `components/functions/FunctionDetailsView.tsx` — Handled inline in `functions/page.tsx` detail panel + `[id]/page.tsx`
- [x] `components/functions/FunctionTestingPanel.tsx` — Handled inline; JSON textarea + Run Test + result display
- [x] `components/functions/FunctionUsageExamples.tsx` — Handled inline; `example_input`/`example_output` from detail endpoint
- [x] `components/functions/FunctionStatistics.tsx` — Handled inline in `[id]/page.tsx` usage stats panel

**Backend endpoints to integrate:**
- [x] `GET  /api/v1/transformation-functions` — Existed; frontend URL prefix fixed; maps `use_count`→`usage_count` at parse time
- [x] `GET  /api/v1/transformation-functions/{id}` — Existed; fetched on function selection to get `function_code`, `example_input`, `example_output`
- [x] `GET  /api/v1/transformation-functions/by-category` — Existed; categories derived from list response (no separate call needed)
- [x] `POST /api/v1/transformation-functions/{id}/test` — Existed; frontend fixed body to `{test_input: ...}` and URL prefix
- [x] `GET  /api/v1/transformation-functions/{id}/usage` — Added; returns `use_count`, `is_builtin`, `is_public`, `category`, `created_at`

**Roles affected:** Designer 🔴, Developer 🟡

---

## Sub-Phase 12C: UX Polish 🟢 LOW PRIORITY

> Improves discoverability, customization, and advanced workflow support.

---

### FRONT-009 — Dashboard Customization

**Status:** `[x]` Complete

**Pages to implement:**
- [x] `app/dashboard/customize/page.tsx` — Existed; thin wrapper delegating to `DashboardCustomizer`; no bugs

**Components to build:**
- [x] `components/dashboard/DashboardBuilder.tsx` — Handled inline in `DashboardCustomizer.tsx` (drag-and-drop reorder, grid layout)
- [x] `components/dashboard/WidgetLibrary.tsx` — Handled inline; `WIDGET_TEMPLATES` catalog modal
- [x] `components/dashboard/WidgetConfigPanel.tsx` — Handled inline; size toggle + duplicate + remove per widget
- [x] `components/dashboard/DashboardTemplates.tsx` — Handled inline; "Layouts & Templates" modal with My Layouts + Templates sections
- [x] `components/dashboard/DashboardPreview.tsx` — Not needed; live canvas serves as preview

**Backend fixes & integrations:**
- [x] Fixed `dashboards.py` — removed duplicate `prefix="/dashboards"` from `APIRouter()` constructor (was double-mounting as `/dashboards/dashboards/*`)
- [x] `GET  /api/v1/dashboards` — Existed; frontend URL fixed from `/dashboards/layouts` → `/dashboards`; response is plain array, removed `.layouts` key lookup; mapped `layout_config.widgets` → `layout`
- [x] `POST /api/v1/dashboards` — Existed; frontend body fixed: `{ layout: widgets }` → `{ name, layout_config: { widgets }, is_default, is_shared }`; response mapped with `mapLayout()`
- [x] `PUT  /api/v1/dashboards/{id}` — Existed; URL fixed from `/dashboards/layouts/{id}` → `/dashboards/{id}`; same body fix
- [x] `DELETE /api/v1/dashboards/{id}` — Existed; URL fixed from `/dashboards/layouts/{id}` → `/dashboards/{id}`
- [x] `GET  /api/v1/dashboards/templates` — Existed; added `loadTemplates()` + `templates` state; shown in Templates modal
- [x] `POST /api/v1/dashboards/{id}/clone` — Existed; added `cloneTemplate()` — clones template into user's layouts and loads it into canvas
- [x] `POST /api/v1/dashboards/{id}/set-default` — Existed; added `setDefaultLayout()` — "Default" button in saved layouts panel
- [x] `GET  /api/v1/dashboards/{id}` — Existed; URL fixed from `/dashboards/layouts/{id}` → `/dashboards/{id}`; `mapLayout()` converts `layout_config.widgets` → `layout`

**Roles affected:** All roles 🟡

---

### FRONT-010 — Enhanced Connector Configuration

**Status:** `[x]` Complete

**Pages to enhance:**
- [x] `app/connectors/configure/page.tsx` — Existed; fixed `handleSubmit` to strip top-level fields (`name`, `is_active`) from `config` payload before POST/PUT; added guaranteed `owner_id` from `currentUser`

**Components to build:**
- [x] `components/connectors/DynamicFormBuilder.tsx` — Handled by `components/forms/DynamicForm.tsx` (already existed); fixed to use `api` axios instance instead of raw `fetch`
- [x] `components/connectors/ConfigurationValidator.tsx` — Handled inline in `configure/page.tsx`; calls `POST /configuration/validate` before save
- [x] `components/connectors/ConfigurationRecommendations.tsx` — Added inline in `DynamicForm.tsx`; debounced `POST /configuration/recommendations` on form value change; amber banner with bullet-list suggestions
- [x] `components/connectors/ConnectionTestPanel.tsx` — Handled in `DynamicForm.tsx`; "Test Connection" button calls `POST /configuration/test-connection`; fixed to use `api` instead of raw `fetch`
- [x] `components/connectors/ConnectorTypeSelector.tsx` — Handled inline in `configure/page.tsx`; grid of cards grouped by category

**Backend endpoints to integrate:**
- [x] `GET  /api/v1/configuration/schemas/{connectorType}` — Existed; `DynamicForm.tsx` fixed to use `api.get` (was raw fetch with manual URL construction)
- [x] `POST /api/v1/configuration/validate` — Existed; called in `configure/page.tsx` before save ✓
- [x] `POST /api/v1/configuration/recommendations` — Existed (note: POST not GET); added in `DynamicForm.tsx` with 900ms debounce on form value changes
- [x] `POST /api/v1/configuration/test-connection` — Existed; `DynamicForm.tsx` fixed to use `api.post` (was raw fetch); note: tracking file listed wrong path `/connectors/test` — actual path is `/configuration/test-connection`
- [x] `GET  /api/v1/configuration/connector-types` — Existed; called in `configure/page.tsx` ✓

**Roles affected:** Developer 🟡, Designer 🟡

---

### FRONT-011 — Global Search Enhancement

**Status:** `[x]` Complete

**Pages to enhance:**
- [x] `app/search/page.tsx` — Existed; rewrote with all bug fixes and enhancements

**Components to build:**
- [x] `components/search/UnifiedSearchBar.tsx` — Handled inline; search input with suggestions dropdown, debounced 300ms on keystroke
- [x] `components/search/SearchResultsView.tsx` — Handled inline; flat results list with entity icon + type badge + match score + metadata preview
- [x] `components/search/SearchFilterPanel.tsx` — Handled inline; entity type toggle buttons (Pipelines / Connectors / Transformations / Users)
- [x] `components/search/SearchSuggestions.tsx` — Handled inline; GET /search/suggestions dropdown with mouse/keyboard dismiss; `onMouseDown` prevents blur-before-click race
- [x] `components/search/RecentSearches.tsx` — Handled inline; persisted to localStorage (key: `jade_search_history`), up to 20 entries, deduped by query

**Backend endpoints to integrate:**
- [x] `GET /api/v1/search` — Existed at `/search/` (root); frontend was calling `/search/global` (wrong) — fixed to `/search`; response `results` is dict-by-entity-type; flattened with `mapToSearchResult()` helper that normalises `name`→`title`, `type`→`entity_type`
- [x] `GET /api/v1/search/suggestions` — Existed; wired with 300ms debounce on query input; dropdown closes on Escape, blur (150ms delay), and Enter
- [x] `GET /api/v1/search/pipelines` — Existed (available via entity_types filter on global search)
- [x] `GET /api/v1/search/connectors` — Existed (available via entity_types filter)
- [x] `GET /api/v1/search/users` — Existed (available via entity_types filter)
- [x] `/search/history` — Did not exist; replaced with localStorage (`jade_search_history`); persisted on every successful search
- [x] `/search/saved` — Did not exist; replaced with localStorage (`jade_saved_searches`); save/delete fully client-side

**Roles affected:** All roles 🟢

---

### FRONT-012 — Schema Introspection Enhancement

**Status:** `[ ]` Not started

**Pages to enhance:**
- [ ] `app/schema/introspect/page.tsx` — Verify existing page and enhance

**Components to build/verify:**
- [ ] `components/schema/SchemaIntrospectionPanel.tsx` — Source connection + introspect trigger
- [ ] `components/schema/SchemaComparisonView.tsx` — Side-by-side schema diff
- [ ] `components/schema/SchemaEvolutionTracker.tsx` — Track schema changes over time

**Backend endpoints to integrate:**
- [ ] `POST /api/v1/schema/introspect/database` — DB schema introspection
- [ ] `POST /api/v1/schema/introspect/api` — API schema introspection
- [ ] `POST /api/v1/schema/introspect/file` — File schema analysis
- [ ] `POST /api/v1/schema/compare` — Schema comparison

**Roles affected:** Developer 🟡, Designer 🟡

---

## Progress Summary

| ID | Feature | Sub-phase | Priority | Status |
|----|---------|-----------|----------|--------|
| FRONT-001 | Alert Management System | 12A | 🔴 High | `[x]` Complete |
| FRONT-002 | WebSocket Real-time Integration | 12A | 🔴 High | `[x]` Complete |
| FRONT-003 | Execution History Viewer | 12A | 🔴 High | `[x]` Complete |
| FRONT-004 | Advanced Analytics Implementation | 12A | 🔴 High | `[x]` Complete |
| FRONT-005 | Log Analysis Interface | 12B | 🟡 Medium | `[x]` Complete |
| FRONT-006 | Pipeline Versioning UI | 12B | 🟡 Medium | `[x]` Complete |
| FRONT-007 | System Cleanup UI | 12B | 🟡 Medium | `[x]` Complete |
| FRONT-008 | Transformation Function Library | 12B | 🟡 Medium | `[x]` Complete |
| FRONT-009 | Dashboard Customization | 12C | 🟢 Low | `[x]` Complete |
| FRONT-010 | Enhanced Connector Configuration | 12C | 🟢 Low | `[x]` Complete |
| FRONT-011 | Global Search Enhancement | 12C | 🟢 Low | `[x]` Complete |
| FRONT-012 | Schema Introspection Enhancement | 12C | 🟢 Low | `[ ]` Not started |

---

## Implementation Standards

All new pages and components must follow the patterns established in the codebase:

- **Auth guard**: Check `usePermissions()` — render `<AccessDenied />` if role lacks access
- **Layout**: Wrap content in `<DashboardLayout>`
- **Data fetching**: `useEffect` with `setLoading(true/false)` and `useToast` for errors
- **API calls**: Add new methods to `frontend/src/lib/api.ts` (axios instance with auth + CSRF interceptors)
- **Error boundaries**: Page-level `error.tsx` files (as added in Phase 11G / UX-001)
- **TypeScript**: Strict types; no `any` except WebSocket message payloads

### WebSocket pattern

```typescript
// src/services/websocket.ts — singleton manager
// src/hooks/useWebSocket.ts — React hook with reconnect + auth
const { connected, data } = useWebSocket('/api/v1/ws/pipeline-status');
```

### API client pattern

```typescript
// Add to frontend/src/lib/api.ts
alerts: {
  getRules:    ()           => api.get('/alerts/rules'),
  createRule:  (data)       => api.post('/alerts/rules', data),
  acknowledge: (id)         => api.post(`/alerts/${id}/acknowledge`),
},
```

---

## New Dependencies (install before starting)

```bash
npm install react-virtuoso          # Virtualized lists (logs, large tables)
npm install @monaco-editor/react    # Code editor (log viewer, query builder)
```

`recharts` and `date-fns` are already installed.
