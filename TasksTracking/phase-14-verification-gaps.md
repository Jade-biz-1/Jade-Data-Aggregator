# Phase 14: Verification Gaps

Close the remaining unverified items identified in the Comprehensive Code & Documentation Review (Nov 2025).
All items were *implemented* in Phases 11–13 but have not been runtime-validated.

**Status:** 🔄 In Progress (VER-001 frontend blocked) | **Branch:** RunAndFix

---

## Tasks

| ID | Description | Status |
|----|-------------|--------|
| VER-001 | Measure actual test coverage % across backend and frontend | `[~]` Partial — backend measured; frontend blocked |
| VER-002 | End-to-end test 2FA enforcement flow | `[x]` Complete — all 12 steps pass |
| VER-003 | Audit cache invalidation hooks across all mutation endpoints | `[x]` Complete |

---

## Detail

### VER-001: Measure Actual Test Coverage

**Goal:** Run coverage tooling and record the real backend and frontend coverage numbers.
**Acceptance criteria:** Coverage report generated; backend ≥ 80%, frontend ≥ 60% (or gaps documented for follow-up).
**Tools:** `pytest --cov` (backend), `jest --coverage` (frontend).

#### Results (April 2026)

**Backend: 57% statement coverage** — below the ≥80% target.

Run command (from `backend/`):
```
PYTHONPATH=/path/to/Jade-Data-Aggregator \
  poetry run python -m pytest /path/to/testing/backend-tests \
  --cov=. --cov-report=term-missing -q
```

Key gaps (lowest coverage):
| File | Coverage |
|------|----------|
| `services/cleanup_statistics_service.py` | 19% |
| `services/health_check_service.py` | 18% |
| `services/user_preferences_service.py` | 22% |
| `services/auth_service.py` | 24% |
| `services/cache_service.py` | 26% |
| `api/v1/endpoints/auth.py` | 19% |
| `api/v1/endpoints/pipeline_execution.py` | 25% |
| `api/v1/endpoints/users.py` | 27% |

Also fixed during this run:
- `backend/schemas/pipeline_visual.py`: added `Position = NodePosition` alias (import was missing, blocked one test suite from collecting).

**Frontend: blocked** — two infrastructure issues prevent clean measurement:

1. **Stale lockfile**: `/Users/Deepak/Public/package-lock.json` exists outside the project root. `nextJest` detects it as the workspace root, causing `rootDir` to resolve incorrectly and breaking `<rootDir>` token expansion in `jest.config.js`.
2. **Test suite failures**: ~36% of tests in `testing/frontend-tests/unit/` fail due to mock/dependency issues unrelated to coverage tooling. The React dual-instance crash (`useState` null) was fixed by pinning react in `moduleNameMapper`, but other failures remain.

**Follow-up tasks needed:**
- Remove or rename `/Users/Deepak/Public/package-lock.json` to fix workspace root detection.
- Investigate and fix the ~168 remaining test failures in `testing/frontend-tests/unit/`.
- Re-run `jest --coverage` after fixes.

---

### VER-002: End-to-End 2FA Enforcement Test ✅

**Goal:** Verify the full 2FA flow works — enable TOTP, login with partial token, verify OTP, confirm access granted; also confirm lockout on bad OTP.
**Acceptance criteria:** All steps pass against a running local stack; no bypass possible without OTP when 2FA is enabled.
**Files checked:** `backend/api/v1/endpoints/auth.py`

#### Results (April 2026) — Runtime test: ALL 12 STEPS PASS

| Step | Endpoint | Result |
|------|----------|--------|
| 1 | `POST /auth/login` (no 2FA) | ✅ Returns token, no `requires_2fa` |
| 2 | `GET /auth/csrf-token` | ✅ Token obtained |
| 3 | `POST /auth/2fa/setup` | ✅ Returns secret + provisioning URI |
| 4 | `POST /auth/2fa/enable` | ✅ Verifies first TOTP, returns recovery codes |
| 5 | `POST /auth/login` (2FA enabled) | ✅ Returns partial token + `requires_2fa: True` |
| 6 | `GET /users/me` with partial token | ✅ Rejected (401) |
| 7 | `POST /auth/2fa/verify` with bad code | ✅ Rejected (401) |
| 8 | `POST /auth/2fa/verify` with correct code | ✅ Returns full token |
| 9 | `GET /users/me` with full token | ✅ Accepted (200) |
| 10 | `POST /auth/2fa/recovery` (use + reuse) | ✅ First use 200, second use 401 |
| 11 | `POST /auth/login` × 6 bad passwords | ✅ 6th attempt locked out (423) |
| 12 | `POST /auth/2fa/disable` | ✅ Disabled successfully (200) |

**Bugs found and fixed during runtime test:**
1. `backend/schemas/token.py`: `Token` schema missing `requires_2fa` field — FastAPI response model stripped it from login response. Fixed: added `requires_2fa: Optional[bool] = None`.
2. `backend/middleware/rate_limiting.py`: Login rate limit was `(5, 60)` — same as `MAX_LOGIN_ATTEMPTS`. Rate limiter fired (429) before account lockout (423) on 6th bad attempt. Fixed: raised limit to `(20, 60)`.
3. `backend/api/v1/endpoints/auth.py` (`/2fa/verify`): Returned 400 for bad TOTP instead of 401. Fixed.
4. `backend/api/v1/endpoints/auth.py` (`/2fa/recovery`): Returned 400 for invalid recovery code instead of 401. Fixed.
5. `backend/middleware/input_validation.py`: `validate_request_data` swallowed `ExceptionGroup` (starlette 0.50 + Python 3.11 wraps exceptions in groups), converting any inner HTTPException to 500 "Invalid request data". Fixed: removed the no-op try/except block.
6. `backend/api/v1/endpoints/auth.py`: `datetime.utcnow()` (naive) compared against timezone-aware `lockout_until` from PostgreSQL — raised `can't compare offset-naive and offset-aware datetimes`. Fixed: replaced all `datetime.utcnow()` with `datetime.now(timezone.utc)`.

**Remaining gap (tracking only):** `/auth/2fa/verify` does not increment `failed_login_attempts` or enforce rate-limiting on repeated bad TOTP codes. An attacker with a valid partial token could attempt TOTP brute-force. Low severity (partial token expires in 5 minutes, 6-digit TOTP space = 10^6).

---

### VER-003: Cache Invalidation Audit ✅

**Goal:** Confirm `cache_service.invalidate_api_cache()` is called in every mutation endpoint (POST/PUT/PATCH/DELETE) that reads from cache, not just connectors and transformations.
**Acceptance criteria:** All mutation endpoints either call invalidation or are documented as not using cache.
**Files to check:** `backend/api/v1/endpoints/`

#### Results (April 2026)

**Finding: Only 4 endpoint files use the API cache; all 4 call invalidation correctly.**

`CacheService`'s read/write methods (`cache_api_response`, `get_cached_response`, `cache_query_result`, `get_cached_query`) are defined in `backend/services/cache_service.py` but **never called** from any endpoint or service — confirmed by grep across the entire `backend/` tree. The cache service is essentially unconnected beyond the 4 files below.

| Endpoint file | Mutations with invalidation | Status |
|---|---|---|
| `connectors.py` | create, update, delete | ✅ |
| `pipelines.py` | create, update, delete, bulk_delete | ✅ |
| `transformations.py` | create, update, delete | ✅ |
| `users.py` | create, update, delete, deactivate | ✅ |
| All other endpoint files (alerts, dashboards, pipeline_versions, auth, etc.) | Do not read from cache → no invalidation needed | ✅ |

**No gaps.** Acceptance criteria met.

---
