"""
Jade Data Aggregator — Locust Load Test Suite (PERF-001)

Usage:
    # Interactive web UI (recommended for baseline capture):
    locust -f locustfile.py --host http://localhost:8001

    # Headless CI run (50 users, 5-user ramp, 60 s):
    locust -f locustfile.py --host http://localhost:8001 \
           --headless -u 50 -r 5 -t 60s \
           --csv reports/baseline --html reports/baseline.html

Target SLOs (see baseline-report.md):
    - p50 response time  < 200 ms
    - p95 response time  < 800 ms
    - p99 response time  < 2000 ms
    - Error rate         < 0.5 %
    - Throughput         > 100 RPS at 50 concurrent users
"""

import json
import random
import string

from locust import HttpUser, SequentialTaskSet, between, events, task


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _random_suffix(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def _admin_token(client) -> str | None:
    """Obtain a JWT for the seeded admin account. Returns None on failure."""
    with client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "AdminPass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        name="/auth/login [setup]",
        catch_response=True,
    ) as resp:
        if resp.status_code == 200:
            body = resp.json()
            if body.get("requires_2fa"):
                resp.failure("Admin account has 2FA enabled — disable for perf tests")
                return None
            return body.get("access_token")
        resp.failure(f"Login failed: {resp.status_code}")
        return None


# ---------------------------------------------------------------------------
# Task sets
# ---------------------------------------------------------------------------

class AuthTaskSet(SequentialTaskSet):
    """Login + register flow (weight: low — one-time auth actions)."""

    def on_start(self):
        self._suffix = _random_suffix()

    @task
    def register_user(self):
        payload = {
            "username": f"perfuser_{self._suffix}",
            "email": f"perfuser_{self._suffix}@example.com",
            "password": "PerfPass123!",
            "full_name": f"Perf User {self._suffix}",
        }
        with self.client.post(
            "/api/v1/auth/register",
            json=payload,
            name="/auth/register",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201, 400):  # 400 = already exists, OK
                resp.success()
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task
    def login(self):
        with self.client.post(
            "/api/v1/auth/login",
            data={
                "username": f"perfuser_{self._suffix}",
                "password": "PerfPass123!",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            name="/auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                token = resp.json().get("access_token")
                if token:
                    self.user.token = token
                    resp.success()
                else:
                    resp.failure("No access_token in response")
            else:
                resp.failure(f"Login failed: {resp.status_code}")

    @task
    def get_profile(self):
        self.client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/users/me",
        )


class ReadHeavyTaskSet(SequentialTaskSet):
    """Read-heavy scenario — simulates dashboard / analytics viewers."""

    @task(5)
    def list_pipelines(self):
        self.client.get(
            "/api/v1/pipelines/?skip=0&limit=20",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/ (list)",
        )

    @task(3)
    def list_connectors(self):
        self.client.get(
            "/api/v1/connectors/?skip=0&limit=20",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/connectors/ (list)",
        )

    @task(3)
    def list_transformations(self):
        self.client.get(
            "/api/v1/transformations/?skip=0&limit=20",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/transformations/ (list)",
        )

    @task(2)
    def list_users(self):
        self.client.get(
            "/api/v1/users/?skip=0&limit=20",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/users/ (list)",
        )

    @task(1)
    def health_live(self):
        self.client.get("/api/v1/health/live", name="/health/live")

    @task(1)
    def health_ready(self):
        self.client.get("/api/v1/health/ready", name="/health/ready")


class WriteHeavyTaskSet(SequentialTaskSet):
    """Write-heavy scenario — simulates pipeline builders creating resources."""

    _pipeline_id: int | None = None
    _connector_id: int | None = None

    @task
    def create_connector(self):
        suffix = _random_suffix()
        payload = {
            "name": f"perf-connector-{suffix}",
            "connector_type": "postgresql",
            "config": {"host": "localhost", "port": 5432, "database": "test"},
        }
        with self.client.post(
            "/api/v1/connectors/",
            json=payload,
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/connectors/ (create)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                self._connector_id = resp.json().get("id")
                resp.success()
            else:
                resp.failure(f"Create connector failed: {resp.status_code}")

    @task
    def create_pipeline(self):
        suffix = _random_suffix()
        payload = {
            "name": f"perf-pipeline-{suffix}",
            "description": "Load test pipeline",
            "source_connector_id": self._connector_id,
            "destination_connector_id": self._connector_id,
            "schedule": "0 * * * *",
        }
        with self.client.post(
            "/api/v1/pipelines/",
            json=payload,
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/ (create)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                self._pipeline_id = resp.json().get("id")
                resp.success()
            else:
                resp.failure(f"Create pipeline failed: {resp.status_code}")

    @task
    def update_pipeline(self):
        if not self._pipeline_id:
            return
        with self.client.put(
            f"/api/v1/pipelines/{self._pipeline_id}",
            json={"description": f"Updated by load test {_random_suffix()}"},
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/{id} (update)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Update pipeline failed: {resp.status_code}")

    @task
    def delete_pipeline(self):
        if not self._pipeline_id:
            return
        with self.client.delete(
            f"/api/v1/pipelines/{self._pipeline_id}",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/{id} (delete)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 204, 404):
                self._pipeline_id = None
                resp.success()
            else:
                resp.failure(f"Delete pipeline failed: {resp.status_code}")

    @task
    def delete_connector(self):
        if not self._connector_id:
            return
        with self.client.delete(
            f"/api/v1/connectors/{self._connector_id}",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/connectors/{id} (delete)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 204, 404):
                self._connector_id = None
                resp.success()
            else:
                resp.failure(f"Delete connector failed: {resp.status_code}")


class MixedTaskSet(SequentialTaskSet):
    """Mixed read/write — most representative of real usage."""

    @task(6)
    def list_pipelines(self):
        self.client.get(
            "/api/v1/pipelines/?skip=0&limit=10",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/ (list)",
        )

    @task(6)
    def list_connectors(self):
        self.client.get(
            "/api/v1/connectors/?skip=0&limit=10",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/connectors/ (list)",
        )

    @task(2)
    def create_and_delete_pipeline(self):
        suffix = _random_suffix()
        with self.client.post(
            "/api/v1/pipelines/",
            json={
                "name": f"mixed-pipeline-{suffix}",
                "description": "Mixed scenario pipeline",
            },
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/pipelines/ (create)",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                pid = resp.json().get("id")
                resp.success()
                if pid:
                    self.client.delete(
                        f"/api/v1/pipelines/{pid}",
                        headers={"Authorization": f"Bearer {self.user.token}"},
                        name="/pipelines/{id} (delete)",
                    )
            else:
                resp.failure(f"Create failed: {resp.status_code}")

    @task(1)
    def profile(self):
        self.client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {self.user.token}"},
            name="/users/me",
        )


# ---------------------------------------------------------------------------
# User classes
# ---------------------------------------------------------------------------

class ReadHeavyUser(HttpUser):
    """Simulates read-heavy viewers and dashboard consumers (70% of load)."""

    weight = 7
    wait_time = between(0.5, 2)
    tasks = [ReadHeavyTaskSet]
    token: str = ""

    def on_start(self):
        token = _admin_token(self.client)
        if token:
            self.token = token


class WriteHeavyUser(HttpUser):
    """Simulates developers creating pipelines and connectors (15% of load)."""

    weight = 1
    wait_time = between(1, 4)
    tasks = [WriteHeavyTaskSet]
    token: str = ""

    def on_start(self):
        token = _admin_token(self.client)
        if token:
            self.token = token


class MixedUser(HttpUser):
    """Simulates typical operators doing both reads and writes (15% of load)."""

    weight = 2
    wait_time = between(0.5, 3)
    tasks = [MixedTaskSet]
    token: str = ""

    def on_start(self):
        token = _admin_token(self.client)
        if token:
            self.token = token


# ---------------------------------------------------------------------------
# Event hooks — print SLO verdict at end of headless run
# ---------------------------------------------------------------------------

@events.quitting.add_listener
def check_slos(environment, **kwargs):
    stats = environment.stats.total
    if stats.num_requests == 0:
        return

    p95 = stats.get_response_time_percentile(0.95) or 0
    p99 = stats.get_response_time_percentile(0.99) or 0
    error_rate = (stats.num_failures / stats.num_requests) * 100

    print("\n=== SLO Verification ===")
    p95_ok = p95 < 800
    p99_ok = p99 < 2000
    err_ok = error_rate < 0.5

    print(f"  p95 latency : {p95:.0f} ms  (target <800 ms)   {'PASS' if p95_ok else 'FAIL'}")
    print(f"  p99 latency : {p99:.0f} ms  (target <2000 ms)  {'PASS' if p99_ok else 'FAIL'}")
    print(f"  Error rate  : {error_rate:.2f}%  (target <0.5%)    {'PASS' if err_ok else 'FAIL'}")
    print(f"  Total RPS   : {stats.total_rps:.1f}")

    if not all([p95_ok, p99_ok, err_ok]):
        environment.process_exit_code = 1
