# Phase 14: Verification Gaps

Close the remaining unverified items identified in the Comprehensive Code & Documentation Review (Nov 2025).
All items were *implemented* in Phases 11–13 but have not been runtime-validated.

**Status:** 🔄 In Progress | **Branch:** RunAndFix

---

## Tasks

| ID | Description | Status |
|----|-------------|--------|
| VER-001 | Measure actual test coverage % across backend and frontend | `[ ]` Pending |
| VER-002 | End-to-end test 2FA enforcement flow | `[ ]` Pending |
| VER-003 | Audit cache invalidation hooks across all mutation endpoints | `[ ]` Pending |

---

## Detail

### VER-001: Measure Actual Test Coverage

**Goal:** Run coverage tooling and record the real backend and frontend coverage numbers.
**Acceptance criteria:** Coverage report generated; backend ≥ 80%, frontend ≥ 60% (or gaps documented for follow-up).
**Tools:** `pytest --cov` (backend), `jest --coverage` (frontend).

---

### VER-002: End-to-End 2FA Enforcement Test

**Goal:** Verify the full 2FA flow works — enable TOTP, login with partial token, verify OTP, confirm access granted; also confirm lockout on bad OTP.
**Acceptance criteria:** All steps pass against a running local stack; no bypass possible without OTP when 2FA is enabled.
**Files to check:** `backend/api/v1/endpoints/auth.py`

---

### VER-003: Cache Invalidation Audit

**Goal:** Confirm `cache_service.invalidate_api_cache()` is called in every mutation endpoint (POST/PUT/PATCH/DELETE) that reads from cache, not just connectors and transformations.
**Acceptance criteria:** All mutation endpoints either call invalidation or are documented as not using cache.
**Files to check:** `backend/api/v1/endpoints/`

---
