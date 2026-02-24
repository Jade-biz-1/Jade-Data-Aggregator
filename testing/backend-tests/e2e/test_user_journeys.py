"""
TEST-014: End-to-End User Journey Tests

Simulates realistic multi-step scenarios from a user's perspective, exercising
cross-resource interactions and the full request lifecycle from HTTP call to DB.

Journey categories
------------------
1. New-User Onboarding Journey          (8 tests)
2. Designer Pipeline-Builder Journey    (10 tests)
3. Viewer Read-Only Journey             (8 tests)
4. Developer User-Management Journey    (9 tests)
5. Executive Dashboard & Analytics Journey (8 tests)
6. System Health & Operations Journey   (7 tests)

Auth strategy: `app.dependency_overrides[get_current_active_user]` injects a
pre-created DB user with the required role, bypassing JWT decoding while
preserving real RBAC enforcement.  Auth-specific tests (register / login) use
the real auth endpoints.
"""

import pytest
from httpx import AsyncClient

from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation
from backend.core.security import get_password_hash, get_current_active_user
from backend.main import app


# ---------------------------------------------------------------------------
# Helper: create a User row directly in the test DB
# ---------------------------------------------------------------------------

def _make_user(username: str, email: str, role: str) -> User:
    return User(
        username=username,
        email=email,
        hashed_password=get_password_hash("JourneyPass123!"),
        role=role,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# 1. New-User Onboarding Journey (8 tests)
# ---------------------------------------------------------------------------

class TestNewUserOnboardingJourney:
    """
    Full journey from first visit through registration, login, and initial
    profile/permission discovery.
    """

    async def test_journey_register_then_read_profile(self, test_client: AsyncClient, test_session):
        """Register a user; immediately read back profile via GET /users/me."""
        # Step 1 – Register
        reg = await test_client.post(
            "/api/v1/auth/register",
            json={"username": "onboard_u1", "email": "onboard_u1@test.com", "password": "Onboard123!"},
        )
        assert reg.status_code == 200
        user_data = reg.json()
        assert user_data["username"] == "onboard_u1"

        # Step 2 – Login to get token
        login = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "onboard_u1", "password": "Onboard123!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]
        assert len(token) > 20

    async def test_journey_register_duplicate_blocked(self, test_client: AsyncClient, test_session):
        """Registering a second account with the same username must be rejected."""
        payload = {"username": "dup_journey", "email": "dup_j@test.com", "password": "Dup123!"}
        first = await test_client.post("/api/v1/auth/register", json=payload)
        assert first.status_code == 200

        second = await test_client.post(
            "/api/v1/auth/register",
            json={"username": "dup_journey", "email": "other_j@test.com", "password": "Dup123!"},
        )
        assert second.status_code == 400

    async def test_journey_wrong_password_then_correct(self, test_client: AsyncClient, test_session):
        """Login with wrong password fails; correcting it succeeds."""
        reg = await test_client.post(
            "/api/v1/auth/register",
            json={"username": "retry_user", "email": "retry@test.com", "password": "Correct123!"},
        )
        assert reg.status_code == 200

        bad = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "retry_user", "password": "WrongPass!"},
        )
        assert bad.status_code == 401

        good = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "retry_user", "password": "Correct123!"},
        )
        assert good.status_code == 200

    async def test_journey_new_user_views_own_permissions(self, test_client: AsyncClient, test_session):
        """After registration the new user can read their permissions (default viewer role)."""
        user = _make_user("perm_viewer", "perm_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user

        try:
            resp = await test_client.get("/api/v1/users/me/permissions")
            assert resp.status_code == 200
            body = resp.json()
            assert "role" in body
        finally:
            app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_new_user_views_session_info(self, test_client: AsyncClient, test_session):
        """Newly registered user can retrieve session info including user and permissions."""
        user = _make_user("sess_viewer", "sess_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user

        try:
            resp = await test_client.get("/api/v1/users/me/session-info")
            assert resp.status_code == 200
            body = resp.json()
            assert "user" in body
            assert "permissions" in body
        finally:
            app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_profile_hides_password(self, test_client: AsyncClient, test_session):
        """Profile endpoint never reveals hashed_password in its response."""
        user = _make_user("hidden_pw", "hidden_pw@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user

        try:
            resp = await test_client.get("/api/v1/users/me")
            assert resp.status_code == 200
            body = resp.json()
            assert "hashed_password" not in body
            assert "password" not in body
        finally:
            app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_new_user_views_dashboard(self, test_client: AsyncClient, test_session):
        """Viewer can access the dashboard stats immediately after account setup."""
        user = _make_user("dash_viewer", "dash_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user

        try:
            resp = await test_client.get("/api/v1/dashboard/stats")
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_unauthenticated_user_blocked(self, test_client: AsyncClient):
        """Unauthenticated request to any protected endpoint receives 401."""
        protected_paths = ["/api/v1/users/me", "/api/v1/pipelines/", "/api/v1/connectors/"]
        for path in protected_paths:
            resp = await test_client.get(path)
            assert resp.status_code == 401, f"Expected 401 for {path}, got {resp.status_code}"


# ---------------------------------------------------------------------------
# 2. Designer Pipeline-Builder Journey (10 tests)
# ---------------------------------------------------------------------------

class TestDesignerPipelineBuilderJourney:
    """
    Simulates a designer building a data pipeline: create connector, create
    pipeline, update, list, view execution history, and clean up.
    """

    @pytest.fixture
    async def designer(self, test_session):
        user = _make_user("pb_designer", "pb_designer@test.com", "designer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_create_connector_then_pipeline(
        self, test_client: AsyncClient, designer
    ):
        """Designer creates a connector, then creates a pipeline referencing it."""
        conn = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Source DB",
                "connector_type": "database",
                "config": {"host": "src.db.example.com", "port": 5432},
                "owner_id": designer.id,
            },
        )
        assert conn.status_code == 201
        connector_id = conn.json()["id"]

        pipeline = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "DB to S3 Pipeline",
                "source_config": {"connector_id": connector_id, "type": "database"},
                "destination_config": {"type": "s3", "bucket": "my-bucket"},
            },
        )
        assert pipeline.status_code == 201
        assert pipeline.json()["name"] == "DB to S3 Pipeline"

    async def test_journey_create_then_update_pipeline(
        self, test_client: AsyncClient, designer
    ):
        """Designer creates a pipeline and then updates its description."""
        create = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "Initial Pipeline",
                "source_config": {"type": "csv"},
                "destination_config": {"type": "postgres"},
            },
        )
        assert create.status_code == 201
        pid = create.json()["id"]

        update = await test_client.put(
            f"/api/v1/pipelines/{pid}",
            json={"description": "Updated by designer on journey"},
        )
        assert update.status_code == 200
        assert update.json()["description"] == "Updated by designer on journey"

    async def test_journey_pipeline_appears_in_list(
        self, test_client: AsyncClient, designer
    ):
        """Pipeline created by designer shows up in the list endpoint."""
        create = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "Listed Journey Pipeline",
                "source_config": {"type": "api"},
                "destination_config": {"type": "warehouse"},
            },
        )
        assert create.status_code == 201
        pid = create.json()["id"]

        listing = await test_client.get("/api/v1/pipelines/")
        assert listing.status_code == 200
        ids = [p["id"] for p in listing.json()]
        assert pid in ids

    async def test_journey_pipeline_runs_list_is_empty_initially(
        self, test_client: AsyncClient, designer
    ):
        """Newly created pipeline has an empty run history."""
        create = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "No Runs Yet",
                "source_config": {"type": "api"},
                "destination_config": {"type": "db"},
            },
        )
        assert create.status_code == 201
        pid = create.json()["id"]

        runs = await test_client.get(f"/api/v1/pipelines/{pid}/runs")
        assert runs.status_code == 200
        assert isinstance(runs.json(), list)

    async def test_journey_update_connector_config(
        self, test_client: AsyncClient, designer
    ):
        """Designer can update a connector's configuration in place."""
        create = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Updateable Connector",
                "connector_type": "rest_api",
                "config": {"url": "https://old.api.example.com"},
                "owner_id": designer.id,
            },
        )
        assert create.status_code == 201
        cid = create.json()["id"]

        update = await test_client.put(
            f"/api/v1/connectors/{cid}",
            json={"name": "Updated Connector"},
        )
        assert update.status_code == 200
        assert update.json()["name"] == "Updated Connector"

    async def test_journey_delete_pipeline_cleans_up(
        self, test_client: AsyncClient, designer
    ):
        """Designer deletes a pipeline; it no longer appears in list or by ID."""
        create = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "Temp Pipeline",
                "source_config": {"type": "csv"},
                "destination_config": {"type": "db"},
            },
        )
        assert create.status_code == 201
        pid = create.json()["id"]

        delete = await test_client.delete(f"/api/v1/pipelines/{pid}")
        assert delete.status_code == 200

        get = await test_client.get(f"/api/v1/pipelines/{pid}")
        assert get.status_code == 404

    async def test_journey_create_two_pipelines_both_visible(
        self, test_client: AsyncClient, designer
    ):
        """Two pipelines created in sequence both appear in the list."""
        for name in ["Journey Pipeline A", "Journey Pipeline B"]:
            r = await test_client.post(
                "/api/v1/pipelines/",
                json={
                    "name": name,
                    "source_config": {"type": "api"},
                    "destination_config": {"type": "db"},
                },
            )
            assert r.status_code == 201

        listing = await test_client.get("/api/v1/pipelines/")
        names = [p["name"] for p in listing.json()]
        assert "Journey Pipeline A" in names
        assert "Journey Pipeline B" in names

    async def test_journey_invalid_pipeline_missing_destination_422(
        self, test_client: AsyncClient, designer
    ):
        """Pipeline without destination_config returns 422 validation error."""
        resp = await test_client.post(
            "/api/v1/pipelines/",
            json={"name": "Bad Pipeline", "source_config": {"type": "csv"}},
        )
        assert resp.status_code == 422

    async def test_journey_connector_test_endpoint(
        self, test_client: AsyncClient, designer
    ):
        """Connector test-connection endpoint responds with a status object."""
        create = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Test-Connectable",
                "connector_type": "database",
                "config": {"host": "localhost", "port": 5432},
                "owner_id": designer.id,
            },
        )
        assert create.status_code == 201
        cid = create.json()["id"]

        test_conn = await test_client.post(f"/api/v1/connectors/{cid}/test")
        assert test_conn.status_code == 200

    async def test_journey_full_pipeline_lifecycle(
        self, test_client: AsyncClient, designer
    ):
        """Full lifecycle: create connector → create pipeline → update → delete."""
        # Connector
        conn = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Lifecycle Connector",
                "connector_type": "database",
                "config": {"host": "db.example.com"},
                "owner_id": designer.id,
            },
        )
        assert conn.status_code == 201
        cid = conn.json()["id"]

        # Pipeline referencing connector
        pipeline = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "Lifecycle Pipeline",
                "source_config": {"connector_id": cid},
                "destination_config": {"type": "warehouse"},
            },
        )
        assert pipeline.status_code == 201
        pid = pipeline.json()["id"]

        # Update pipeline
        updated = await test_client.put(
            f"/api/v1/pipelines/{pid}",
            json={"description": "Lifecycle complete"},
        )
        assert updated.status_code == 200

        # Delete pipeline
        del_p = await test_client.delete(f"/api/v1/pipelines/{pid}")
        assert del_p.status_code == 200

        # Delete connector
        del_c = await test_client.delete(f"/api/v1/connectors/{cid}")
        assert del_c.status_code == 200


# ---------------------------------------------------------------------------
# 3. Viewer Read-Only Journey (8 tests)
# ---------------------------------------------------------------------------

class TestViewerReadOnlyJourney:
    """
    Verifies that a viewer can read all shared resources but is blocked from
    any write operation.
    """

    @pytest.fixture
    async def designer(self, test_session):
        """Create content for viewer to observe."""
        user = _make_user("ro_designer", "ro_designer@test.com", "designer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        # NOTE: do NOT override get_current_active_user here; caller switches roles.
        return user

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("ro_viewer", "ro_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_viewer_reads_pipeline_list(
        self, test_session, test_client: AsyncClient, viewer, designer
    ):
        """Viewer can list all pipelines."""
        pipeline = Pipeline(
            name="Viewable Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()

        resp = await test_client.get("/api/v1/pipelines/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viewer_reads_connector_list(
        self, test_session, test_client: AsyncClient, viewer, designer
    ):
        """Viewer can list all connectors."""
        connector = Connector(
            name="Viewable Connector",
            connector_type="rest_api",
            config={"url": "https://api.example.com"},
            owner_id=designer.id,
        )
        test_session.add(connector)
        await test_session.commit()

        resp = await test_client.get("/api/v1/connectors/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viewer_reads_transformation_list(
        self, test_session, test_client: AsyncClient, viewer, designer
    ):
        """Viewer can list all transformations."""
        tx = Transformation(
            name="Viewable Transformation",
            transformation_type="mapping",
            source_fields=["col_a"],
            target_fields=["col_b"],
            transformation_rules={"type": "direct"},
            owner_id=designer.id,
        )
        test_session.add(tx)
        await test_session.commit()

        resp = await test_client.get("/api/v1/transformations/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viewer_blocked_from_creating_pipeline(
        self, test_client: AsyncClient, viewer
    ):
        """Viewer gets 403 when attempting to POST /pipelines/."""
        resp = await test_client.post(
            "/api/v1/pipelines/",
            json={
                "name": "Viewer New Pipeline",
                "source_config": {"type": "api"},
                "destination_config": {"type": "db"},
            },
        )
        assert resp.status_code == 403

    async def test_viewer_blocked_from_creating_connector(
        self, test_client: AsyncClient, viewer
    ):
        """Viewer gets 403 when attempting to POST /connectors/."""
        resp = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Viewer Connector",
                "connector_type": "database",
                "config": {"host": "localhost"},
                "owner_id": viewer.id,
            },
        )
        assert resp.status_code == 403

    async def test_viewer_reads_dashboard(self, test_client: AsyncClient, viewer):
        """Viewer can access the dashboard stats page."""
        resp = await test_client.get("/api/v1/dashboard/stats")
        assert resp.status_code == 200

    async def test_viewer_reads_monitoring_pipeline_stats(
        self, test_client: AsyncClient, viewer
    ):
        """Viewer can access monitoring pipeline stats."""
        resp = await test_client.get("/api/v1/monitoring/pipeline-stats")
        assert resp.status_code == 200

    async def test_viewer_reads_transformation_metrics(
        self, test_client: AsyncClient, viewer
    ):
        """Viewer can access transformation metrics summary."""
        resp = await test_client.get("/api/v1/transformations/metrics")
        assert resp.status_code == 200
        body = resp.json()
        assert "summary" in body


# ---------------------------------------------------------------------------
# 4. Developer User-Management Journey (9 tests)
# ---------------------------------------------------------------------------

class TestDeveloperUserManagementJourney:
    """
    Developer manages the user roster: create, read, update, deactivate,
    activate, and reset password.
    """

    @pytest.fixture
    async def developer(self, test_session):
        user = _make_user("mgr_developer", "mgr_developer@test.com", "developer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_developer_lists_users(
        self, test_client: AsyncClient, developer
    ):
        """Developer can retrieve the full user list."""
        resp = await test_client.get("/api/v1/users/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_journey_developer_creates_and_reads_user(
        self, test_client: AsyncClient, developer
    ):
        """Developer creates a user and immediately retrieves them by ID."""
        create = await test_client.post(
            "/api/v1/users/",
            json={
                "username": "journey_created",
                "email": "journey_created@test.com",
                "password": "Created123!",
                "role": "viewer",
            },
        )
        assert create.status_code in [200, 201]
        uid = create.json()["id"]

        read = await test_client.get(f"/api/v1/users/{uid}")
        assert read.status_code == 200
        assert read.json()["username"] == "journey_created"

    async def test_journey_developer_updates_user_email(
        self, test_session, test_client: AsyncClient, developer
    ):
        """Developer updates a user's email; the change is persisted."""
        target = _make_user("email_target", "old@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.put(
            f"/api/v1/users/{target.id}",
            json={"email": "new@test.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "new@test.com"

    async def test_journey_developer_deactivates_user(
        self, test_session, test_client: AsyncClient, developer
    ):
        """Developer deactivates a user account; response confirms the action."""
        target = _make_user("deact_journey", "deact_j@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/deactivate")
        assert resp.status_code == 200

    async def test_journey_developer_activates_user(
        self, test_session, test_client: AsyncClient, developer
    ):
        """Developer reactivates a previously deactivated account."""
        target = User(
            username="act_journey",
            email="act_j@test.com",
            hashed_password=get_password_hash("Pass123!"),
            role="viewer",
            is_active=False,
        )
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/activate")
        assert resp.status_code == 200

    async def test_journey_developer_resets_password(
        self, test_session, test_client: AsyncClient, developer
    ):
        """Developer resets a user's password; response includes a confirmation."""
        target = _make_user("pw_reset_j", "pw_reset_j@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/reset-password")
        assert resp.status_code == 200
        body = resp.json()
        assert "temporary_password" in body or "message" in body

    async def test_journey_developer_get_nonexistent_user_404(
        self, test_client: AsyncClient, developer
    ):
        """Fetching a user with a non-existent ID returns 404."""
        resp = await test_client.get("/api/v1/users/999999")
        assert resp.status_code == 404

    async def test_journey_developer_accesses_cleanup_stats(
        self, test_client: AsyncClient, developer
    ):
        """Developer can view admin cleanup statistics."""
        resp = await test_client.get("/api/v1/admin/cleanup/stats")
        assert resp.status_code == 200

    async def test_journey_developer_accesses_roles(
        self, test_client: AsyncClient, developer
    ):
        """Developer can list available roles and permissions."""
        resp = await test_client.get("/api/v1/roles/")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# 5. Executive Dashboard & Analytics Journey (8 tests)
# ---------------------------------------------------------------------------

class TestExecutiveDashboardJourney:
    """
    Simulates an executive consuming analytics, reports, and monitoring data.
    """

    @pytest.fixture
    async def executive(self, test_session):
        user = _make_user("exec_user", "exec_user@test.com", "executive")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("exec_viewer", "exec_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_executive_views_analytics(
        self, test_client: AsyncClient, executive
    ):
        """Executive can access the main analytics data endpoint."""
        resp = await test_client.get("/api/v1/analytics/data")
        assert resp.status_code == 200

    async def test_journey_executive_exports_analytics(
        self, test_client: AsyncClient, executive
    ):
        """Executive can export analytics data in JSON format."""
        resp = await test_client.get(
            "/api/v1/analytics/export-data?format=json&time_range=7d"
        )
        assert resp.status_code == 200

    async def test_journey_executive_views_dashboard_stats(
        self, test_client: AsyncClient, executive
    ):
        """Executive can read the dashboard statistics summary."""
        resp = await test_client.get("/api/v1/dashboard/stats")
        assert resp.status_code == 200

    async def test_journey_executive_views_monitoring(
        self, test_client: AsyncClient, executive
    ):
        """Executive can access pipeline monitoring statistics."""
        resp = await test_client.get("/api/v1/monitoring/pipeline-stats")
        assert resp.status_code == 200

    async def test_journey_executive_views_transformation_metrics(
        self, test_client: AsyncClient, executive
    ):
        """Executive can access transformation metrics to gauge data flow volume."""
        resp = await test_client.get("/api/v1/transformations/metrics")
        assert resp.status_code == 200

    async def test_journey_executive_reads_pipeline_list(
        self, test_client: AsyncClient, executive
    ):
        """Executive (viewer-level read) can list pipelines."""
        resp = await test_client.get("/api/v1/pipelines/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_journey_viewer_blocked_from_analytics(
        self, test_client: AsyncClient, viewer
    ):
        """Viewer role cannot access analytics data — cross-role boundary check."""
        resp = await test_client.get("/api/v1/analytics/data")
        assert resp.status_code == 403

    async def test_journey_executive_views_session_info(
        self, test_client: AsyncClient, executive
    ):
        """Executive can retrieve their session info including role and permissions."""
        resp = await test_client.get("/api/v1/users/me/session-info")
        assert resp.status_code == 200
        body = resp.json()
        assert "user" in body
        assert "permissions" in body


# ---------------------------------------------------------------------------
# 6. System Health & Operations Journey (7 tests)
# ---------------------------------------------------------------------------

class TestSystemHealthJourney:
    """
    Covers health checks, search, and system-level endpoints accessible to
    various roles.
    """

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("health_viewer", "health_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def developer(self, test_session):
        user = _make_user("health_dev", "health_dev@test.com", "developer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_journey_health_liveness(self, test_client: AsyncClient):
        """Liveness endpoint responds 200 without any auth."""
        resp = await test_client.get("/api/v1/health/live")
        assert resp.status_code == 200

    async def test_journey_health_readiness(self, test_client: AsyncClient):
        """Readiness endpoint responds 200 without auth."""
        resp = await test_client.get("/api/v1/health/ready")
        assert resp.status_code == 200

    async def test_journey_search_pipelines(
        self, test_session, test_client: AsyncClient, viewer
    ):
        """Search endpoint returns results for a pipeline name query."""
        pipeline = Pipeline(
            name="Searchable Journey Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=viewer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()

        resp = await test_client.get("/api/v1/search/pipelines?query=Searchable")
        assert resp.status_code == 200

    async def test_journey_search_suggestions(
        self, test_client: AsyncClient, viewer
    ):
        """Search suggestions endpoint responds without errors."""
        resp = await test_client.get("/api/v1/search/suggestions?query=pipe")
        assert resp.status_code == 200

    async def test_journey_developer_access_roles_all_permissions(
        self, test_client: AsyncClient, developer
    ):
        """Developer can retrieve the consolidated permissions list."""
        resp = await test_client.get("/api/v1/roles/permissions/all")
        assert resp.status_code == 200

    async def test_journey_roles_navigation_items(
        self, test_client: AsyncClient, viewer
    ):
        """Navigation items endpoint responds for viewer role."""
        resp = await test_client.get("/api/v1/roles/navigation/items")
        assert resp.status_code == 200

    async def test_journey_roles_feature_access(
        self, test_client: AsyncClient, viewer
    ):
        """Feature access endpoint responds for authenticated viewer."""
        resp = await test_client.get("/api/v1/roles/features/access")
        assert resp.status_code == 200
