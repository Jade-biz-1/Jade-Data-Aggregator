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

**Status:** `[ ]` Not started

**Pages to implement:**
- [ ] `app/analytics/advanced/page.tsx` — Replace current placeholder with full implementation

**Components to build:**
- [ ] `components/analytics/CustomQueryBuilder.tsx` — Visual query builder (filters, aggregations)
- [ ] `components/analytics/ReportBuilder.tsx` — Report creation with column/chart selection
- [ ] `components/analytics/TrendAnalysisView.tsx` — Time-series trend visualization
- [ ] `components/analytics/ComparativeAnalyticsView.tsx` — Period-over-period comparison
- [ ] `components/analytics/ReportExportPanel.tsx` — Export to CSV / JSON / Excel
- [ ] `components/analytics/ScheduledReportsManager.tsx` — Schedule and manage automated exports

**Backend endpoints to integrate:**
- [ ] `POST /api/v1/analytics/advanced/query` — Execute custom query
- [ ] `POST /api/v1/analytics/advanced/reports` — Create report
- [ ] `GET  /api/v1/analytics/advanced/reports` — List reports
- [ ] `GET  /api/v1/analytics/advanced/trends` — Trend data
- [ ] `POST /api/v1/analytics/advanced/export` — On-demand export
- [ ] `POST /api/v1/analytics/advanced/scheduled-exports` — Create schedule
- [ ] `GET  /api/v1/analytics/advanced/scheduled-exports` — List schedules

**Roles affected:** Executive 🔴, Admin 🔴

---

## Sub-Phase 12B: Essential Tools 🟡 MEDIUM PRIORITY

> Improves debugging efficiency, production safety, and designer productivity.

---

### FRONT-005 — Log Analysis Interface

**Status:** `[ ]` Not started

**Pages to create:**
- [ ] `app/logs/page.tsx` — Main log viewer with search and filters
- [ ] `app/logs/correlations/[id]/page.tsx` — Full correlation ID trace view

**Components to build:**
- [ ] `components/logs/LogViewer.tsx` — Virtualized log list with syntax highlighting
- [ ] `components/logs/LogSearchForm.tsx` — Advanced search (level, time range, service)
- [ ] `components/logs/LogFilterPanel.tsx` — Quick filter controls (level chips, date picker)
- [ ] `components/logs/CorrelationTracker.tsx` — Request trace waterfall
- [ ] `components/logs/ErrorTrendChart.tsx` — Error rate over time chart
- [ ] `components/logs/LogStatistics.tsx` — Volume, error rate, top-error summary

**Backend endpoints to integrate:**
- [ ] `GET  /api/v1/logs` — Search logs (paginated)
- [ ] `GET  /api/v1/logs/correlation/{id}` — Correlation trace
- [ ] `GET  /api/v1/logs/statistics` — Log statistics
- [ ] `GET  /api/v1/logs/errors/trends` — Error trend data
- [ ] `POST /api/v1/logs/export` — Export log segment

**Roles affected:** Developer 🔴, Admin 🟡

---

### FRONT-006 — Pipeline Versioning UI

**Status:** `[ ]` Not started

**Pages to create:**
- [ ] `app/pipelines/[id]/versions/page.tsx` — Version history list
- [ ] `app/pipelines/[id]/versions/compare/page.tsx` — Side-by-side diff view

**Components to build:**
- [ ] `components/versioning/VersionHistoryTable.tsx` — Paginated version list with tags
- [ ] `components/versioning/VersionDiffViewer.tsx` — JSON / config diff visualization
- [ ] `components/versioning/VersionRollbackModal.tsx` — Confirmation + impact summary
- [ ] `components/versioning/VersionTagForm.tsx` — Add / edit version tags and notes
- [ ] `components/versioning/VersionTimelineView.tsx` — Visual commit-style timeline

**Backend endpoints to integrate:**
- [ ] `GET  /api/v1/pipelines/{id}/versions` — Version history
- [ ] `GET  /api/v1/pipelines/{id}/versions/{versionId}` — Version detail
- [ ] `POST /api/v1/pipelines/{id}/versions/{versionId}/activate` — Activate version
- [ ] `GET  /api/v1/pipelines/{id}/versions/compare` — Compare two versions
- [ ] `POST /api/v1/pipelines/{id}/versions/{versionId}/tags` — Add tag / note

**Roles affected:** Developer 🔴, Designer 🟡

---

### FRONT-007 — System Cleanup UI

**Status:** `[ ]` Not started

**Pages to enhance:**
- [ ] `app/admin/maintenance/page.tsx` — Enhance existing page (do not recreate)

**Components to build:**
- [ ] `components/admin/CleanupOperationsPanel.tsx` — One-click cleanup buttons with confirmation
- [ ] `components/admin/CleanupStatistics.tsx` — Before/after disk and record counts
- [ ] `components/admin/CleanupHistoryTable.tsx` — Past cleanup jobs with results
- [ ] `components/admin/CleanupScheduler.tsx` — Cron-style schedule configuration
- [ ] `components/admin/DiskSpaceMetrics.tsx` — Visual disk usage gauge

**Backend endpoints to integrate:**
- [ ] `POST /api/v1/admin/cleanup/activity-logs` — Clean activity logs
- [ ] `POST /api/v1/admin/cleanup/orphaned-data` — Remove orphaned data
- [ ] `POST /api/v1/admin/cleanup/temp-files` — Remove temp files
- [ ] `POST /api/v1/admin/cleanup/execution-logs` — Clean execution logs
- [ ] `POST /api/v1/admin/cleanup/database-vacuum` — Vacuum database
- [ ] `POST /api/v1/admin/cleanup/sessions` — Clean expired sessions
- [ ] `POST /api/v1/admin/cleanup/all` — Run all cleanups
- [ ] `GET  /api/v1/admin/cleanup/statistics` — Cleanup stats
- [ ] `GET  /api/v1/admin/cleanup/history` — Cleanup history

**Roles affected:** Admin 🔴

---

### FRONT-008 — Transformation Function Library

**Status:** `[ ]` Not started

**Pages to create:**
- [ ] `app/transformations/functions/page.tsx` — Function catalog with category browse
- [ ] `app/transformations/functions/[id]/page.tsx` — Function detail + usage examples

**Components to build:**
- [ ] `components/functions/FunctionCatalog.tsx` — Searchable function grid
- [ ] `components/functions/FunctionCategoryFilter.tsx` — Category sidebar navigation
- [ ] `components/functions/FunctionDetailsView.tsx` — Signature, description, parameters
- [ ] `components/functions/FunctionTestingPanel.tsx` — Interactive input/output tester
- [ ] `components/functions/FunctionUsageExamples.tsx` — Code examples (Python / SQL)
- [ ] `components/functions/FunctionStatistics.tsx` — Usage count, popularity rank

**Backend endpoints to integrate:**
- [ ] `GET  /api/v1/transformation-functions` — List all functions (paginated)
- [ ] `GET  /api/v1/transformation-functions/{id}` — Function detail
- [ ] `GET  /api/v1/transformation-functions/categories` — Category list
- [ ] `POST /api/v1/transformation-functions/test` — Test function with sample data
- [ ] `GET  /api/v1/transformation-functions/{id}/usage` — Usage statistics

**Roles affected:** Designer 🔴, Developer 🟡

---

## Sub-Phase 12C: UX Polish 🟢 LOW PRIORITY

> Improves discoverability, customization, and advanced workflow support.

---

### FRONT-009 — Dashboard Customization

**Status:** `[ ]` Not started

**Pages to implement:**
- [ ] `app/dashboard/customize/page.tsx` — Full drag-and-drop dashboard builder

**Components to build:**
- [ ] `components/dashboard/DashboardBuilder.tsx` — Drag-and-drop widget canvas
- [ ] `components/dashboard/WidgetLibrary.tsx` — Available widget catalog
- [ ] `components/dashboard/WidgetConfigPanel.tsx` — Per-widget settings panel
- [ ] `components/dashboard/DashboardTemplates.tsx` — Template browser
- [ ] `components/dashboard/DashboardPreview.tsx` — Live preview while editing

**Backend endpoints to integrate:**
- [ ] `GET    /api/v1/dashboards` — User's saved dashboards
- [ ] `POST   /api/v1/dashboards` — Create dashboard
- [ ] `PUT    /api/v1/dashboards/{id}` — Update dashboard
- [ ] `DELETE /api/v1/dashboards/{id}` — Delete dashboard
- [ ] `GET    /api/v1/dashboards/templates` — Dashboard templates
- [ ] `POST   /api/v1/dashboards/{id}/clone` — Clone dashboard
- [ ] `POST   /api/v1/dashboards/{id}/set-default` — Set as default

**Roles affected:** All roles 🟡

---

### FRONT-010 — Enhanced Connector Configuration

**Status:** `[ ]` Not started

**Pages to enhance:**
- [ ] `app/connectors/configure/page.tsx` — Enhance existing page

**Components to build:**
- [ ] `components/connectors/DynamicFormBuilder.tsx` — Schema-driven form generation
- [ ] `components/connectors/ConfigurationValidator.tsx` — Real-time field validation
- [ ] `components/connectors/ConfigurationRecommendations.tsx` — Best-practice suggestions
- [ ] `components/connectors/ConnectionTestPanel.tsx` — Enhanced test with diagnostics
- [ ] `components/connectors/ConnectorTypeSelector.tsx` — Visual connector type catalog

**Backend endpoints to integrate:**
- [ ] `GET  /api/v1/configuration/schema/{connectorType}` — Config schema for type
- [ ] `POST /api/v1/configuration/validate` — Validate configuration
- [ ] `GET  /api/v1/configuration/recommendations` — Best-practice recommendations
- [ ] `POST /api/v1/connectors/test` — Test connection
- [ ] `GET  /api/v1/configuration/connector-types` — Connector type catalog

**Roles affected:** Developer 🟡, Designer 🟡

---

### FRONT-011 — Global Search Enhancement

**Status:** `[ ]` Not started

**Pages to enhance:**
- [ ] `app/search/page.tsx` — Enhance existing search page

**Components to build:**
- [ ] `components/search/UnifiedSearchBar.tsx` — Enhanced typeahead search bar
- [ ] `components/search/SearchResultsView.tsx` — Grouped results by entity type
- [ ] `components/search/SearchFilterPanel.tsx` — Entity type, date range, role filters
- [ ] `components/search/SearchSuggestions.tsx` — Debounced auto-complete dropdown
- [ ] `components/search/RecentSearches.tsx` — Persisted recent search history

**Backend endpoints to integrate:**
- [ ] `GET /api/v1/search` — Global cross-entity search
- [ ] `GET /api/v1/search/suggestions` — Auto-complete suggestions
- [ ] `GET /api/v1/search/pipelines` — Pipeline-scoped search
- [ ] `GET /api/v1/search/connectors` — Connector-scoped search
- [ ] `GET /api/v1/search/users` — User-scoped search

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
| FRONT-004 | Advanced Analytics Implementation | 12A | 🔴 High | `[ ]` Not started |
| FRONT-005 | Log Analysis Interface | 12B | 🟡 Medium | `[ ]` Not started |
| FRONT-006 | Pipeline Versioning UI | 12B | 🟡 Medium | `[ ]` Not started |
| FRONT-007 | System Cleanup UI | 12B | 🟡 Medium | `[ ]` Not started |
| FRONT-008 | Transformation Function Library | 12B | 🟡 Medium | `[ ]` Not started |
| FRONT-009 | Dashboard Customization | 12C | 🟢 Low | `[ ]` Not started |
| FRONT-010 | Enhanced Connector Configuration | 12C | 🟢 Low | `[ ]` Not started |
| FRONT-011 | Global Search Enhancement | 12C | 🟢 Low | `[ ]` Not started |
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
