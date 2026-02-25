# 🚀 Project Bootstrap Document

**Read this before every session to ground yourself in the project context.**

## 📋 Project Overview
**Name**: Data Aggregator Platform
**Description**: A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format.
**Stack**:
- **Backend**: Python (FastAPI), SQLAlchemy, Celery, Redis
- **Frontend**: TypeScript (Next.js 15+), Tailwind CSS, React Flow
- **Infrastructure**: Docker, PostgreSQL, Redis, Kafka

## 🚦 Current Status
**Overall**: 🔴 **NOT PRODUCTION READY** (Critical fixes required)
- **Phase 10 (Tutorial Application)**: 🔄 **95% COMPLETE**
- **Phase 11 (Production Readiness & Critical Fixes)**: 🔴 **NOT STARTED**
- **Testing Status**: ⚠️ Low actual coverage (Backend ~23%, API ~37%, Frontend ~12%)
- **Security Status**: ⚠️ Middleware present but not activated in `backend/main.py`
- **Documentation Status**: ⚠️ Inaccurate tech claims exist (Spark/Flink/InfluxDB)

## 📂 Key Documentation

- **`IMPLEMENTATION_TASKS.md`**: **CRITICAL**. High-level roadmap index pointing to the canonical tracker in `TasksTracking/`.
- **`TasksTracking/`**: Phase-by-phase task breakdowns and current backlog (update these markdown files as work progresses).
- **`README.md`**: General project documentation and setup instructions.
- **`docs/prd.md`**: Product Requirements Document.
- **`docs/UserGuide.md`**: Comprehensive user guide.
- **`docs/architecture.md`**: Original architecture description.
- **`docs/archive/`**: Archive of inactive but historically important documents and decision records.
- **`docs/`**: Detailed documentation for specific features and phases.
- **`testing/`**: Extensive testing implementation (separate from main code).
- **`tutorial/`**: Tutorial application code and documentation for user tutorials.

## 📝 Workflow Rules

1. **Bootstrap**: Read this file (`BOOTSTRAP.md`) at the start of every session.
2. **Task Tracking**:
   - Use `TasksTracking/overview.md` and the phase files to identify next steps.
   - Update the relevant `TasksTracking/phase-*.md` file immediately after completing a task.
   - **Concise Summaries**: If specs are clear, just mark the task status. Avoid exhaustive summaries unless necessary.
3. **Task Boundary**: Use `task_boundary` tool to track progress in the UI.
4. **Artifacts**: Maintain `task.md` for session-level tracking.

## ⏭️ Immediate Next Steps (Highest Impact)

1. **Phase 11A – Critical Security Fixes**
   - Wire security headers, rate limiting, and validation middleware; add regression tests.
   - Add centralized error handling with correlation IDs and scrubbed responses.
   - Enforce strong `SECRET_KEY` configuration and rotation guidance.
2. **Phase 11B – Test Coverage Expansion**
   - Prioritize security-sensitive services (email, file upload, WebSocket auth, search injection, monitoring).
3. **Phase 11D – Documentation Corrections**
   - Remove inaccurate tech claims and align architecture/PRD/schema docs.
4. **Phase 10D – Tutorial Polish & QA**
   - Visual consistency, accessibility audit, cross-browser checks, QA, and deployment.

## 🆕 February 2026 Update

- Backend security middleware regression tests (Phase 11A) successfully executed.
- Fixed missing dependencies (`pyotp`, `aiosqlite`) and updated Poetry lockfile.
- Resolved import errors in Token schema and middleware hooks.
- Refactored test harness for async fixtures and SQLite compatibility.
- Improved error handling in rate limiting and input validation middleware.
- ExceptionGroup handling updated for Python 3.12.
- All blocking issues resolved; 4 tests passed, deprecation warnings remain.

---
**Last Updated:** February 25, 2026
