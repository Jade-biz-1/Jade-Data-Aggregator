# Performance Baseline Report — PERF-001

## Summary

This document defines the **target SLOs**, test methodology, and instructions for capturing and comparing baseline performance metrics for the Jade Data Aggregator backend API.

---

## Target SLOs

| Metric | Target | Notes |
|--------|--------|-------|
| p50 response time | < 200 ms | Median across all endpoints |
| p95 response time | < 800 ms | 95th percentile |
| p99 response time | < 2 000 ms | 99th percentile |
| Error rate | < 0.5 % | HTTP 5xx or connection errors |
| Throughput | > 100 RPS | At 50 concurrent users, steady state |

---

## Test Methodology

### Tool

[Locust](https://locust.io) v2.32.x — Python-based distributed load testing.

### Scenarios

| Scenario (User class) | Weight | Wait time | Behaviour |
|-----------------------|--------|-----------|-----------|
| `ReadHeavyUser` | 70 % | 0.5–2 s | List pipelines, connectors, transformations, users |
| `MixedUser` | 15 % | 0.5–3 s | Mixed reads + create/delete pipeline |
| `WriteHeavyUser` | 15 % | 1–4 s | Create connector → pipeline → update → delete |

### Ramp profile

| Phase | Users | Duration |
|-------|-------|----------|
| Warm-up | 10 | 30 s |
| Ramp | 10 → 50 | 80 s (5 users/s) |
| Steady-state | 50 | 5 min |
| Cool-down | 50 → 0 | automatic |

### Endpoints under test

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET  /api/v1/users/me`
- `GET  /api/v1/users/`
- `GET  /api/v1/pipelines/`
- `POST /api/v1/pipelines/`
- `PUT  /api/v1/pipelines/{id}`
- `DELETE /api/v1/pipelines/{id}`
- `GET  /api/v1/connectors/`
- `POST /api/v1/connectors/`
- `DELETE /api/v1/connectors/{id}`
- `GET  /api/v1/transformations/`
- `GET  /api/v1/health/live`
- `GET  /api/v1/health/ready`

---

## Running Tests

### Prerequisites

```bash
cd testing/performance-tests
pip install -r requirements.txt
```

Ensure the backend is running and a seeded `admin` user exists with password `AdminPass123!` and **2FA disabled**.

### Interactive (with UI)

```bash
locust -f locustfile.py --host http://localhost:8001
# Open http://localhost:8089 in browser
```

### Headless — quick smoke (10 users, 30 s)

```bash
locust -f locustfile.py \
  --host http://localhost:8001 \
  --headless -u 10 -r 2 -t 30s \
  --csv reports/smoke --html reports/smoke.html
```

### Headless — full baseline (50 users, 5 min)

```bash
mkdir -p reports
locust -f locustfile.py \
  --host http://localhost:8001 \
  --headless -u 50 -r 5 -t 360s \
  --csv reports/baseline --html reports/baseline.html
```

### Against staging / production

```bash
locust -f locustfile.py \
  --host https://dataaggregator.com \
  --headless -u 50 -r 5 -t 360s \
  --csv reports/prod-baseline --html reports/prod-baseline.html
```

---

## Interpreting Results

Locust produces:
- `reports/baseline_stats.csv` — per-endpoint aggregated metrics
- `reports/baseline_failures.csv` — failure details
- `reports/baseline_stats_history.csv` — time-series RPS/latency
- `reports/baseline.html` — self-contained HTML report

At the end of a headless run the test suite prints an SLO verdict:

```
=== SLO Verification ===
  p95 latency : 342 ms  (target <800 ms)   PASS
  p99 latency : 890 ms  (target <2000 ms)  PASS
  Error rate  : 0.02%   (target <0.5%)     PASS
  Total RPS   : 134.7
```

A non-zero exit code is returned if any SLO is breached, enabling CI failure gating.

---

## Baseline Results (captured pre-production)

> **Note**: Replace with actual numbers after running against a production-like environment.

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | Error % |
|----------|----------|----------|----------|---------|
| POST /auth/login | — | — | — | — |
| GET /pipelines/ | — | — | — | — |
| POST /pipelines/ | — | — | — | — |
| GET /connectors/ | — | — | — | — |
| GET /health/live | — | — | — | — |
| **Aggregate** | — | — | — | — |

Run the baseline test suite and paste the CSV values into this table before going live.

---

## CI Integration

Add the following step to `.github/workflows/ci.yml` (performance gate on merge to main):

```yaml
- name: Run performance baseline
  run: |
    pip install -r testing/performance-tests/requirements.txt
    locust -f testing/performance-tests/locustfile.py \
      --host ${{ secrets.STAGING_URL }} \
      --headless -u 50 -r 5 -t 120s \
      --csv testing/performance-tests/reports/ci \
      --html testing/performance-tests/reports/ci.html
  env:
    LOCUST_ADMIN_PASSWORD: ${{ secrets.PERF_ADMIN_PASSWORD }}
```

---

## Tuning Guidance

| Symptom | Likely cause | Remediation |
|---------|-------------|-------------|
| p95 > 800 ms on list endpoints | Missing DB index or N+1 | Add index; use `selectinload` |
| High error rate under 50 users | DB connection pool exhausted | Increase `pool_size` in SQLAlchemy |
| p99 spike on write endpoints | Cache invalidation latency | Confirm Redis is reachable; make invalidation async |
| Login endpoint slow | bcrypt cost too high | Reduce `BCRYPT_ROUNDS` for perf env only |
