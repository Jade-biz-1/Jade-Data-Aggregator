import pytest

from backend.core.config import settings
from backend.main import app


class FakeRedis:
    def __init__(self):
        self.store = {}

    def zremrangebyscore(self, key, _min_score, max_score):
        if key not in self.store:
            return 0
        self.store[key] = [score for score in self.store[key] if score > max_score]
        return 1

    def zcard(self, key):
        return len(self.store.get(key, []))

    def zrange(self, key, start, stop, withscores=False):
        scores = sorted(self.store.get(key, []))
        sliced = scores[start:stop + 1]
        if withscores:
            return [(str(score), score) for score in sliced]
        return [str(score) for score in sliced]

    def zadd(self, key, mapping):
        self.store.setdefault(key, [])
        for _, score in mapping.items():
            self.store[key].append(score)
        return 1

    def expire(self, _key, _seconds):
        return True


@pytest.mark.asyncio
async def test_security_headers_applied(test_client):
    response = await test_client.get("/health")

    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert "Content-Security-Policy" in response.headers


@pytest.mark.asyncio
async def test_correlation_id_propagates_on_404(test_client):
    correlation_id = "test-correlation-id"

    response = await test_client.get(
        "/__missing__",
        headers={"X-Correlation-ID": correlation_id}
    )

    assert response.status_code == 404
    assert response.headers.get("X-Correlation-ID") == correlation_id

    payload = response.json()
    assert payload.get("correlation_id") == correlation_id


@pytest.mark.asyncio
async def test_global_error_handler_scrubs_in_production(test_client):
    path = "/__test__/boom"

    async def boom():
        raise RuntimeError("sensitive detail")

    app.router.add_api_route(path, boom, methods=["GET"])

    old_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"

    try:
        response = await test_client.get(path)
    finally:
        settings.ENVIRONMENT = old_env
        app.router.routes = [
            route for route in app.router.routes
            if getattr(route, "path", None) != path
        ]

    assert response.status_code == 500
    payload = response.json()
    assert "sensitive detail" not in payload.get("detail", "")
    assert payload.get("correlation_id")


@pytest.mark.asyncio
async def test_rate_limiting_enforced_for_auth_login(test_client):
    fake_redis = FakeRedis()
    original_redis = getattr(app.state, "redis", None)
    app.state.redis = fake_redis

    try:
        responses = []
        for _ in range(6):
            responses.append(await test_client.post("/api/v1/auth/login", json={}))
    finally:
        app.state.redis = original_redis

    assert responses[-1].status_code == 429
    assert responses[-1].headers.get("Retry-After") is not None
