# Data Aggregator Platform — Comprehensive Project Understanding (GPT-5)

> _This document captures the current end-to-end understanding of the Data Aggregator Platform as of 2025-11-06. It consolidates repository structure, architecture, technology choices, feature coverage, delivery status, and outstanding concerns to serve as the primary reference for future work._

---

## 1. Product Overview

- **Mission**: Provide a unified, configurable platform that connects to heterogeneous data sources, processes data through orchestrated pipelines (batch and streaming), and delivers standardized outputs with rich monitoring, RBAC, and analytics.
- **Deployment Targets**: Local (Docker Compose), staged/production cloud (AWS-centric Terraform stack with ECS, RDS, MSK, ElastiCache). Kubernetes manifests planned.
- **Key Capabilities** (Phase 1-9 complete, Phase 10 tutorial at 95%):
  - Full CRUD across pipelines, connectors, transformations, users.
  - Visual pipeline builder with React Flow, schema mapping, transformation library.
  - Real-time dashboards via WebSockets, analytics, monitoring stack, activity logging.
  - 6-role RBAC (admin, developer, designer, executor, viewer, executive) with feature-level permissions and navigation gating.
  - File processing (chunked uploads, validation, virus scanning) and system cleanup services.
  - Extensive documentation set (architecture, deployment, security, runbook, testing plans, tutorial materials).

## 2. Repository Topology & Key Artifacts

```text
/
├── backend/                 # FastAPI services
├── frontend/                # Next.js 15 App Router
├── docs/                    # Canonical documentation set (architecture, PRD, security, deployment, troubleshooting, tutorial)
├── infrastructure/, terraform/, monitoring/ # Ops & infra
├── IMPLEMENTATION_TASKS.md  # Master roadmap (Phases 1-10)
├── CHANGELOG.md             # Chronological change log
├── PROJECT_COMPLETION_SUMMARY.md, PHASE_*.md, etc. # Progress write-ups
└── docker-compose*.yml, Dockerfile(s), pyproject.toml, package.json, README.md
```

_Notable supporting folders_: `tutorial/` (learning app), `testing/` (backend + frontend suites), `backups/`, `migrations/`, `monitoring/` stack, `docs/archive/` for historical analyses.

## 3. Backend (FastAPI, Python 3.11)

### 3.1 Architecture and Modules

- **Entry**: `backend/main.py` (FastAPI application factory, middleware, routers, startup tasks).
- **Routers**: Located under `backend/api/v1/endpoints/` (212 endpoints, 26 routers). Highlights include:
  - `users.py`, `auth.py`: Authentication, user CRUD, password flows, session-info aggregation.
  - `pipelines.py`, `pipeline_runs.py`, `pipeline_builder.py`: Pipeline CRUD, execution engine, template/versioning.
  - `connectors.py`, `transformations.py`: Connector configuration, transformation library.
  - `monitoring.py`, `analytics.py`, `dashboard.py`: Metrics, analytics datasets, recent activity.
  - `admin.py`: Cleanup services (11 endpoints), activity logs, developer-role safeguards.
- **Core Services** (`backend/services/`): ActivityLogService, CleanupService, PermissionService, PipelineExecutionEngine, SchemaIntrospectionService, DynamicConfigurationService, FileProcessingService, HealthCheckService, etc. CleanupService (368 LOC) now fully ORM-based.
- **Models & Schemas**:
  - SQLAlchemy models in `backend/models/` (13+ models inc. User, Pipeline, PipelineRun, UserPreference, SystemSettings, ActivityLog, FileUpload).
  - Pydantic schemas in `backend/schemas/` aligned with API contracts; `UserRole` enum anchors RBAC.
- **Core Utilities**: `backend/core/` houses security (JWT, hashing), permissions (role matrix, inheritance), config, database session management (`core/database.py`), RBAC helpers (`core/rbac.py`), caching helpers, logging configuration.

### 3.2 Security & RBAC

- JWT authentication with refresh tokens, password reset, email verification.
- Middleware: admin protection (prevents developer role from modifying admin), inactive-user gating, developer-role production safeguard.
- Session info endpoint (`GET /api/v1/users/me/session-info`) consolidates user info, permissions, navigation, feature flags. RBACService normalizes DB string roles to `UserRole` enum.
- Permissions defined in `backend/core/permissions.py` and surfaced via `PermissionService.get_feature_access` and navigation helpers.

### 3.3 Pipeline & Processing Engine

- Pipeline models support traditional and visual definitions (graph stored via JSONB).
- Execution engine manages step orchestration, status tracking, logs, rollback. Accessible via `/pipelines/{id}/execute` and `pipeline_runs` endpoints.
- Scheduler interfaces (cron, manual, event-based) and test/dry-run support per Implementation roadmap.
- Connector service handles configuration templating, connection testing, metadata extraction.
- Transformation engine provides function library, test harness, preview, and code generation (SQL/Python) for schema mappings.

### 3.4 Monitoring & Maintenance

- Health endpoints (live, ready, metrics) with Prometheus instrumentation (Phase 5).
- Activity logging stored via `UserActivityLog` with admin querying endpoints.
- CleanupService provides:
  - Temp file purge, orphaned records cleanup, execution log trimming, DB vacuum, session cleanup, composite "clean all" action.
  - Statistics endpoint surfaces DB sizing, stale records, disk utilization for admin UI.
  - Scheduling endpoints allow cron configuration (`SystemSettings` persisted).

### 3.5 Testing

- Pytest suite (~220 backend tests + 54 E2E) covering endpoints, services, models, pipeline execution, auth.
- Coverage target 80% (Implementation doc). Additional frontend unit tests, load/security automation recommended in upcoming work.

## 4. Frontend (Next.js 15.5.4, React 19)

### 4.1 Structure & Patterns

- App Router (`frontend/src/app/`) with segmented directories (`dashboard`, `pipelines`, `connectors`, `analytics`, `monitoring`, `transformations`, `users`, `docs`, etc.).
- Shared layouts: `layout.tsx`, `DashboardLayout`, RBAC-aware sidebar/header components.
- UI components under `src/components/` (ui, layout, charts, forms, admin, common). Tailwind CSS theme with custom tokens.
- Hooks: `usePermissions`, `useAuthStore` (Zustand), `useToast`, real-time hooks (WebSockets).
- API client: `src/lib/api.ts` centralizes REST calls with cookie-based token propagation and error handling (redirects on 401, inactive flows). Future work: unify admin maintenance fetches via this client.
- State: Zustand stores for auth, preferences, pipeline builder state; context providers for theme/user preferences.
- Real-time: WebSocket integration for monitoring dashboards and notifications.

### 4.2 Key Screens & Features

- **Authentication**: Login, register, change password modals, account inactive gate.
- **Dashboard**: Real-time metrics, activity feed, pipeline summaries, customizable widgets.
- **Pipelines**: Enhanced tables (sorting, bulk actions), creation wizard, visual builder (React Flow), template/versioning UI, execution monitor.
- **Connectors & Transformations**: Dynamic forms (JSON schema-driven), validation, test connection, transformation previews.
- **Monitoring**: Live system health dashboard, logs viewer, alert manager, resource monitors.
- **Admin Maintenance**: Cleanup actions, statistics, scheduling, dev-role warning banner, role assignment UI.
- **Search & Files**: Global command palette (Cmd/Ctrl+K) with autocomplete, entity filters, history; file upload dashboard with chunked progress and previews.
- **Preferences**: Theme (light/dark/high-contrast), accessibility, regional settings, customizable dashboard layouts.
- **Docs Page**: In-app documentation (`src/app/docs/page.tsx`) rendering curated markdown content (currently raising escape warning; inspection required to confirm sanitized string usage).

### 4.3 Testing & Tooling

- Jest/React Testing Library groundwork, Playwright for E2E (Implementation tasks). Need to confirm actual coverage; Implementation doc states backend tests verified Oct 24, E2E ready but check repo for test files.
- Linting via ESLint, formatting via Prettier. Tailwind classes enforced.
- Vite? (No; Next.js dev server). Observed warnings: Next dev chooses port 3001 when 3000 busy; multi-lockfile warning due to workspace root detection.

## 5. Infrastructure & Operations

- **Docker Compose**: Primary local stack in `docker-compose.yml` exposing PostgreSQL, Redis, Kafka, Zookeeper, backend (FastAPI with autoreload), frontend. Frontend container now targets backend via `localhost:8001` for local development (`NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1`).
- **Monitoring Stack**: `monitoring/` contains Prometheus, Grafana, Loki, Alertmanager definitions. Additional Compose file `docker-compose.monitoring.yml` for observability.
- **Terraform**: Provisioning for AWS VPC, ECS, RDS, MSK, ElastiCache, ALB. Deploy instructions in `DEPLOYMENT_GUIDE_COMPLETE.md`, `docs/deployment-guide.md`, `infrastructure/README.md`.
- **CI/CD**: GitHub Actions workflows (not inspected here) for lint/test/build/deploy (Implementation doc T019/T020). Docker multi-stage builds in root `Dockerfile` and frontend-specific Dockerfiles.
- **Backups**: `backups/database/`, `backend/core/init_db.py` handles default admin + dev accounts with toggles (`CREATE_DEV_USER`, `ALLOW_DEV_ROLE_IN_PRODUCTION`, `AUTO_INIT_DB`). Cleanup includes DB backup reminders.

## 6. Documentation & Knowledge Base

- **Primary Docs** (`docs/`): architecture diagrams, PRD, use cases, runbook, security guide, deployment instructions per cloud, troubleshooting, testing plans, monitoring, API reference.
- **Phase Summaries**: `PHASE_3_COMPLETION_SUMMARY.md`, `PHASE_8_COMPLETION_SUMMARY.md`, etc. Provide granular records of deliverables.
- **Tutorial Materials**: `tutorial/` contains onboarding modules (Phase 10) — currently 95% complete per Implementation doc.
- **Operational Logs**: `DAILY_PROGRESS_*.md`, `VERIFICATION_COMPLETE_OCT_24.md`, etc. track day-by-day progress.
- **Master Roadmap**: `IMPLEMENTATION_TASKS.md` (2,600+ lines) enumerates Phases 1-10, status, risk, resource plans, verification notes (updated Nov 2, 2025). Serves as canonical progress tracker.

## 7. Current Status Snapshot (per 2025-11-06)

- **Backend**: 100% feature-complete, security audited, cleanup services refactored to SQLAlchemy, session-info endpoint stabilized (enum conversion fix). Tests: 220 backend + 54 E2E verified (Oct 24).
- **Frontend**: All 26 routes implemented, RBAC gating fixed (`usePermissions` now reads token from cookie; note: still performs 3 fetches per load — optimization pending). Monitoring UI, file manager, preferences, dashboard customization, search implemented.
- **Docs**: ~95% coverage. Critical docs exist but confirm currency (especially after recent API additions).
- **Open Items** (from Implementation roadmap & recent findings):
  1. Replace `usePermissions` triple-fetch with consolidated `/users/me/session-info` call (frontend refactor pending; backend endpoint already exists).
  2. Swap native `alert`/`confirm` inside admin maintenance UI for design-system modals; reroute manual `fetch` to centralized `apiClient` for consistency.
  3. Add unit/E2E tests for cleanup endpoints, maintenance UI interactions, permissions SSO flows per Gemini recommendations.
  4. Resolve `docs` page build error (unicode escape warning indicates raw string with backslashes in template literal; needs sanitization or Markdown rendering change).
  5. Verify docker-compose vs docker compose command usage across docs/scripts (user note suggests aligning on `docker compose`).
  6. Re-run coverage to confirm 80% target and document results.
  7. Audit `.env` requirements for new flags (`AUTO_INIT_DB`, `ALLOW_DEV_ROLE_IN_PRODUCTION`, etc.).

## 8. Risks & Watchpoints

- **Security**: Developer role safeguards rely on environment flags; ensure production pipelines disable `CREATE_DEV_USER` and require explicit override for developer access.
- **Documentation Drift**: High volume of docs requires regular updates, especially API reference, troubleshooting, and runbooks when endpoints evolve.
- **Testing Debt**: Although backend coverage strong, frontend unit test coverage not fully documented; confirm Playwright suite exists and is wired into CI.
- **Deployment**: Terraform and monitoring stacks should be validated against latest AWS AMI changes. Kubernetes manifests still planned; track if production moves beyond ECS.
- **Large Markdown Strings**: `docs` page uses template literals with escaped Markdown; ensure sanitation to avoid runtime errors (current unicode escape warning).

## 9. Recommended Next Steps

1. **Stabilize session-info consumption**: Update frontend `usePermissions` to use `/users/me/session-info` exclusively, reduce latency, and align with cookie-based auth (partial fix already reading cookies).
2. **Fix docs page build error**: Convert large template literals to imported Markdown/MDX or sanitize escapes in `src/app/docs/page.tsx` (the current reported error is an Escaped newline `\n` inside template literal fed to Next compiler).
3. **Augment Testing**: Add targeted Playwright flows (RBAC navigation verification, maintenance cleanup actions, developer-role warning, file upload). Ensure tests cover newly fixed session-info path.
4. **Refine Admin Maintenance UI**: Replace native alert/confirm dialogs, centralize API calls, add Recharts visualizations for cleanup stats as per deferred Gemini suggestion.
5. **Documentation Sync**: Regenerate API docs reflecting consolidated session-info endpoint, cleanup statistics schema, auth flow updates. Ensure `docs/security.md` references 6-role RBAC matrix and developer safeguards.
6. **Operational Validation**: Run `docker compose` stack end-to-end, confirm frontend uses backend service discovery (works after env fix), re-run `docker compose logs frontend/backend` to verify absence of 404 on session-info (should be resolved).

## 10. Reference Index

- **README.md**: Architecture overview, quickstart, infrastructure instructions.
- **docs/architecture.md**: Detailed system architecture layers, component diagrams, technology stack, data flows (updated 2025-09-28).
- **docs/prd.md**: Product requirements with functional specs, FR identifiers.
- **docs/security.md**: Security posture, RBAC, compliance guidelines.
- **docs/deployment-guide.md** & `DEPLOYMENT_GUIDE_COMPLETE.md`: Cloud deployment procedures (AWS; includes Terraform, ECS, CI/CD steps).
- **docs/runbook.md**: Operational playbook with incident response, maintenance, troubleshooting.
- **docs/troubleshooting.md**: Known issues, resolutions, support contacts.
- **IMPLEMENTATION_TASKS.md**: Phased roadmap (10 phases), completion metrics, risk register, verification notes through Oct-Nov 2025.
- **PHASE_*_COMPLETION_SUMMARY.md** files: Snapshot reports for completed phases.
- **VERIFICATION_COMPLETE_OCT_24.md**: Testing verification record (220 backend + 54 E2E tests confirmed).
- **tutorial/**: Phase 10 tutorial modules, onboarding instructions, specification.

---

_This understanding document should be kept current whenever substantial architectural, operational, or documentation changes occur. Cross-reference with `CHANGELOG.md` and `IMPLEMENTATION_TASKS.md` when planning new work._
