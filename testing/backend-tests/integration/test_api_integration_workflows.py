"""
TEST-013: API Integration Workflow Tests

Tests multi-step workflows that span multiple API endpoints, exercising
cross-resource interactions, role-based access, and end-to-end business flows.

Auth strategy: most tests override `get_current_active_user` via
`app.dependency_overrides` to inject a pre-created DB user with the required
role, bypassing JWT decoding while keeping real RBAC enforcement.
Auth-specific tests (login, register) exercise the real auth endpoints.
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
        hashed_password=get_password_hash("TestPass123!"),
        role=role,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# 1. Auth Workflow (8 tests)
# ---------------------------------------------------------------------------

class TestAuthWorkflow:
    """Authentication endpoint workflows: register, login, error paths."""

    async def test_register_new_user(self, test_client: AsyncClient):
        """New user can self-register via /auth/register."""
        payload = {
            "username": "reg_user",
            "email": "reg_user@test.com",
            "password": "RegPass123!",
        }
        resp = await test_client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 200
        body = resp.json()
        assert body["username"] == "reg_user"
        assert "password" not in body

    async def test_login_returns_bearer_token(self, test_session, test_client: AsyncClient):
        """Successful login returns access_token and bearer type."""
        user = _make_user("login_user", "login@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()

        resp = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "login_user", "password": "TestPass123!"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 20

    async def test_register_then_login_succeeds(self, test_client: AsyncClient):
        """Register followed immediately by login works end-to-end."""
        creds = {
            "username": "reg_login",
            "email": "reg_login@test.com",
            "password": "RegLogin123!",
        }
        reg = await test_client.post("/api/v1/auth/register", json=creds)
        assert reg.status_code == 200

        login = await test_client.post(
            "/api/v1/auth/login",
            data={"username": creds["username"], "password": creds["password"]},
        )
        assert login.status_code == 200
        assert "access_token" in login.json()

    async def test_duplicate_username_rejected(self, test_session, test_client: AsyncClient):
        """Registering with an already-taken username returns 400."""
        user = _make_user("dup_user", "dup@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()

        resp = await test_client.post(
            "/api/v1/auth/register",
            json={"username": "dup_user", "email": "other@test.com", "password": "Pass123!"},
        )
        assert resp.status_code == 400

    async def test_login_wrong_password_returns_401(self, test_session, test_client: AsyncClient):
        """Login with incorrect password returns 401."""
        user = _make_user("wrong_pw_user", "wrongpw@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()

        resp = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "wrong_pw_user", "password": "BadPassword!"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_user_returns_401(self, test_client: AsyncClient):
        """Login with non-existent user returns 401."""
        resp = await test_client.post(
            "/api/v1/auth/login",
            data={"username": "ghost_user", "password": "AnyPass123!"},
        )
        assert resp.status_code == 401

    async def test_no_token_returns_401(self, test_client: AsyncClient):
        """Request to protected endpoint without any token returns 401."""
        resp = await test_client.get("/api/v1/pipelines/")
        assert resp.status_code == 401

    async def test_malformed_token_returns_401(self, test_client: AsyncClient):
        """Malformed Bearer token returns 401 or 422."""
        resp = await test_client.get(
            "/api/v1/pipelines/",
            headers={"Authorization": "Bearer this.is.not.a.real.jwt"},
        )
        assert resp.status_code in [401, 422]


# ---------------------------------------------------------------------------
# 2. Current-User & Session Workflow (7 tests)
# ---------------------------------------------------------------------------

class TestCurrentUserWorkflow:
    """Tests for /users/me, /users/me/permissions, and /users/me/session-info."""

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("cu_viewer", "cu_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def admin(self, test_session):
        user = _make_user("cu_admin", "cu_admin@test.com", "admin")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_get_my_profile(self, test_client: AsyncClient, viewer):
        """Authenticated user can retrieve their own profile."""
        resp = await test_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        body = resp.json()
        assert body["username"] == "cu_viewer"
        assert body["email"] == "cu_viewer@test.com"

    async def test_get_my_permissions(self, test_client: AsyncClient, viewer):
        """Permissions endpoint returns role and permissions list."""
        resp = await test_client.get("/api/v1/users/me/permissions")
        assert resp.status_code == 200
        body = resp.json()
        assert "role" in body
        assert body["role"] == "viewer"

    async def test_session_info_contains_user(self, test_client: AsyncClient, viewer):
        """/users/me/session-info response includes a user object."""
        resp = await test_client.get("/api/v1/users/me/session-info")
        assert resp.status_code == 200
        body = resp.json()
        assert "user" in body

    async def test_session_info_includes_permissions(self, test_client: AsyncClient, viewer):
        """/users/me/session-info response includes a permissions object."""
        resp = await test_client.get("/api/v1/users/me/session-info")
        assert resp.status_code == 200
        body = resp.json()
        assert "permissions" in body

    async def test_viewer_profile_shows_viewer_role(self, test_client: AsyncClient, viewer):
        """Viewer user profile correctly reports role=viewer."""
        resp = await test_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"

    async def test_admin_profile_shows_admin_role(self, test_client: AsyncClient, admin):
        """Admin user profile correctly reports role=admin."""
        resp = await test_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    async def test_profile_does_not_expose_password(self, test_client: AsyncClient, viewer):
        """Profile response must not contain password or hashed_password."""
        resp = await test_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        body = resp.json()
        assert "password" not in body
        assert "hashed_password" not in body


# ---------------------------------------------------------------------------
# 3. Pipeline CRUD Workflow (10 tests)
# ---------------------------------------------------------------------------

class TestPipelineWorkflow:
    """Designer creates / reads / updates / deletes pipelines; viewer is read-only."""

    @pytest.fixture
    def pipeline_payload(self):
        return {
            "name": "Integration Pipeline",
            "description": "Created during workflow test",
            "source_config": {"type": "database", "host": "src-db"},
            "destination_config": {"type": "s3", "bucket": "dest-bucket"},
            "is_active": True,
        }

    @pytest.fixture
    async def designer(self, test_session):
        user = _make_user("pl_designer", "pl_designer@test.com", "designer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("pl_viewer", "pl_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_designer_creates_pipeline(self, test_client, designer, pipeline_payload):
        """Designer can create a pipeline and receives 201 with id."""
        resp = await test_client.post("/api/v1/pipelines/", json=pipeline_payload)
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body
        assert body["name"] == pipeline_payload["name"]
        assert body["is_active"] is True

    async def test_viewer_cannot_create_pipeline(self, test_client, viewer, pipeline_payload):
        """Viewer lacks permission to create pipelines — expects 403."""
        resp = await test_client.post("/api/v1/pipelines/", json=pipeline_payload)
        assert resp.status_code == 403

    async def test_viewer_reads_pipeline_list(self, test_session, test_client, viewer):
        """Viewer can list pipelines."""
        pipeline = Pipeline(
            name="Viewable",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=viewer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()
        resp = await test_client.get("/api/v1/pipelines/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_designer_reads_pipeline_by_id(self, test_session, test_client, designer):
        """Designer can retrieve a specific pipeline."""
        pipeline = Pipeline(
            name="Fetch Me",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        resp = await test_client.get(f"/api/v1/pipelines/{pipeline.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Fetch Me"

    async def test_designer_updates_pipeline(self, test_session, test_client, designer):
        """Designer can update pipeline name and description."""
        pipeline = Pipeline(
            name="Old Name",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        resp = await test_client.put(
            f"/api/v1/pipelines/{pipeline.id}",
            json={"name": "New Name", "description": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    async def test_viewer_cannot_update_pipeline(self, test_session, test_client, designer, viewer):
        """Viewer cannot update a pipeline; designer creates, viewer fails to update."""
        # Create as designer, then switch to viewer
        pipeline = Pipeline(
            name="Designer Made",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer.id,
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Switch to viewer
        app.dependency_overrides[get_current_active_user] = lambda: viewer

        resp = await test_client.put(
            f"/api/v1/pipelines/{pipeline.id}",
            json={"name": "Viewer Update Attempt"},
        )
        assert resp.status_code == 403

    async def test_designer_deletes_pipeline(self, test_client, designer, pipeline_payload):
        """Designer can delete a pipeline; subsequent GET returns 404."""
        create = await test_client.post("/api/v1/pipelines/", json=pipeline_payload)
        assert create.status_code == 201
        pid = create.json()["id"]

        delete = await test_client.delete(f"/api/v1/pipelines/{pid}")
        assert delete.status_code == 200

        get = await test_client.get(f"/api/v1/pipelines/{pid}")
        assert get.status_code == 404

    async def test_pipeline_not_found_returns_404(self, test_client, designer):
        """Requesting a non-existent pipeline ID returns 404."""
        resp = await test_client.get("/api/v1/pipelines/999999")
        assert resp.status_code == 404

    async def test_create_pipeline_missing_source_config_422(self, test_client, designer):
        """Creating a pipeline without source_config returns 422 validation error."""
        resp = await test_client.post(
            "/api/v1/pipelines/",
            json={"name": "Incomplete", "destination_config": {"type": "db"}},
        )
        assert resp.status_code == 422

    async def test_pipeline_full_lifecycle(self, test_client, designer, pipeline_payload):
        """Create → read → update → delete lifecycle completes without errors."""
        # Create
        c = await test_client.post("/api/v1/pipelines/", json=pipeline_payload)
        assert c.status_code == 201
        pid = c.json()["id"]

        # Read
        r = await test_client.get(f"/api/v1/pipelines/{pid}")
        assert r.status_code == 200

        # Update
        u = await test_client.put(f"/api/v1/pipelines/{pid}", json={"description": "Lifecycle update"})
        assert u.status_code == 200
        assert u.json()["description"] == "Lifecycle update"

        # Delete
        d = await test_client.delete(f"/api/v1/pipelines/{pid}")
        assert d.status_code == 200

        # Verify gone
        g = await test_client.get(f"/api/v1/pipelines/{pid}")
        assert g.status_code == 404


# ---------------------------------------------------------------------------
# 4. Connector Workflow (8 tests)
# ---------------------------------------------------------------------------

class TestConnectorWorkflow:
    """Connector CRUD workflows across designer and viewer roles."""

    @pytest.fixture
    async def designer(self, test_session):
        user = _make_user("cn_designer", "cn_designer@test.com", "designer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("cn_viewer", "cn_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_designer_creates_connector(self, test_client, designer):
        """Designer can create a database connector."""
        resp = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Prod DB",
                "connector_type": "database",
                "config": {"host": "db.example.com", "port": 5432},
                "owner_id": designer.id,
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Prod DB"
        assert body["connector_type"] == "database"

    async def test_viewer_reads_connector_list(self, test_session, test_client, viewer, designer):
        """Viewer can list all connectors."""
        connector = Connector(
            name="Listed Connector",
            connector_type="rest_api",
            config={"url": "https://api.example.com"},
            owner_id=designer.id,
        )
        test_session.add(connector)
        await test_session.commit()

        app.dependency_overrides[get_current_active_user] = lambda: viewer

        resp = await test_client.get("/api/v1/connectors/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viewer_cannot_create_connector(self, test_client, viewer):
        """Viewer receives 403 when attempting to create a connector."""
        resp = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "Unauthorized Connector",
                "connector_type": "file",
                "config": {"path": "/data"},
                "owner_id": viewer.id,
            },
        )
        assert resp.status_code == 403

    async def test_designer_reads_connector_by_id(self, test_session, test_client, designer):
        """Designer can retrieve a single connector by ID."""
        connector = Connector(
            name="Single Fetch",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=designer.id,
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        resp = await test_client.get(f"/api/v1/connectors/{connector.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Single Fetch"

    async def test_designer_updates_connector(self, test_session, test_client, designer):
        """Designer can update connector name."""
        connector = Connector(
            name="Before Update",
            connector_type="rest_api",
            config={"url": "https://old.example.com"},
            owner_id=designer.id,
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        resp = await test_client.put(
            f"/api/v1/connectors/{connector.id}",
            json={"name": "After Update"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "After Update"

    async def test_designer_deletes_connector(self, test_client, designer):
        """Designer can delete a connector; subsequent read returns 404."""
        create = await test_client.post(
            "/api/v1/connectors/",
            json={
                "name": "To Delete",
                "connector_type": "file",
                "config": {"path": "/tmp"},
                "owner_id": designer.id,
            },
        )
        assert create.status_code == 201
        cid = create.json()["id"]

        delete = await test_client.delete(f"/api/v1/connectors/{cid}")
        assert delete.status_code == 200

        get = await test_client.get(f"/api/v1/connectors/{cid}")
        assert get.status_code == 404

    async def test_viewer_cannot_delete_connector(self, test_session, test_client, viewer, designer):
        """Viewer cannot delete a connector."""
        connector = Connector(
            name="Protected Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=designer.id,
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        app.dependency_overrides[get_current_active_user] = lambda: viewer

        resp = await test_client.delete(f"/api/v1/connectors/{connector.id}")
        assert resp.status_code == 403

    async def test_connector_not_found_returns_404(self, test_client, designer):
        """Requesting a non-existent connector returns 404."""
        resp = await test_client.get("/api/v1/connectors/999999")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 5. User Management Workflow (9 tests)
# ---------------------------------------------------------------------------

class TestUserManagementWorkflow:
    """Developer and admin manage users; viewer is blocked."""

    @pytest.fixture
    async def developer(self, test_session):
        user = _make_user("um_developer", "um_developer@test.com", "developer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("um_viewer", "um_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_developer_lists_users(self, test_client, developer):
        """Developer can list all users via GET /users/."""
        resp = await test_client.get("/api/v1/users/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viewer_cannot_list_users(self, test_client, viewer):
        """Viewer receives 403 when attempting to list users."""
        resp = await test_client.get("/api/v1/users/")
        assert resp.status_code == 403

    async def test_developer_creates_user(self, test_client, developer):
        """Developer can create a new user."""
        resp = await test_client.post(
            "/api/v1/users/",
            json={
                "username": "new_created_user",
                "email": "new_created@test.com",
                "password": "Created123!",
                "role": "viewer",
            },
        )
        assert resp.status_code in [200, 201]
        assert resp.json()["username"] == "new_created_user"

    async def test_developer_gets_user_by_id(self, test_session, test_client, developer):
        """Developer can retrieve a specific user by ID."""
        target = _make_user("fetch_target", "fetch_target@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.get(f"/api/v1/users/{target.id}")
        assert resp.status_code == 200
        assert resp.json()["username"] == "fetch_target"

    async def test_developer_updates_user_email(self, test_session, test_client, developer):
        """Developer can update a user's email address."""
        target = _make_user("update_target", "old_email@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.put(
            f"/api/v1/users/{target.id}",
            json={"email": "new_email@test.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "new_email@test.com"

    async def test_developer_deactivates_user(self, test_session, test_client, developer):
        """Developer can deactivate an active user."""
        target = _make_user("deact_target", "deact@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/deactivate")
        assert resp.status_code == 200
        assert "deactivated" in resp.json()["message"].lower()

    async def test_developer_activates_user(self, test_session, test_client, developer):
        """Developer can activate a previously inactive user."""
        target = User(
            username="activate_target",
            email="activate@test.com",
            hashed_password=get_password_hash("Pass123!"),
            role="viewer",
            is_active=False,
        )
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/activate")
        assert resp.status_code == 200
        assert "activated" in resp.json()["message"].lower()

    async def test_developer_resets_user_password(self, test_session, test_client, developer):
        """Developer can reset another user's password; receives temp password."""
        target = _make_user("reset_target", "reset@test.com", "viewer")
        test_session.add(target)
        await test_session.commit()
        await test_session.refresh(target)

        resp = await test_client.post(f"/api/v1/users/{target.id}/reset-password")
        assert resp.status_code == 200
        body = resp.json()
        assert "temporary_password" in body or "message" in body

    async def test_get_user_not_found_404(self, test_client, developer):
        """Requesting a non-existent user ID returns 404."""
        resp = await test_client.get("/api/v1/users/999999")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 6. Dashboard & Monitoring Workflow (8 tests)
# ---------------------------------------------------------------------------

class TestDashboardMonitoringWorkflow:
    """Tests cross-role access to dashboard, monitoring, and analytics."""

    @pytest.fixture
    async def viewer(self, test_session):
        user = _make_user("dm_viewer", "dm_viewer@test.com", "viewer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def executive(self, test_session):
        user = _make_user("dm_executive", "dm_executive@test.com", "executive")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def developer(self, test_session):
        user = _make_user("dm_developer", "dm_developer@test.com", "developer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    @pytest.fixture
    async def designer(self, test_session):
        user = _make_user("dm_designer", "dm_designer@test.com", "designer")
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        app.dependency_overrides[get_current_active_user] = lambda: user
        yield user
        app.dependency_overrides.pop(get_current_active_user, None)

    async def test_viewer_accesses_dashboard_stats(self, test_client, viewer):
        """Viewer can access /dashboard/stats (all roles allowed)."""
        resp = await test_client.get("/api/v1/dashboard/stats")
        assert resp.status_code == 200

    async def test_viewer_accesses_monitoring_pipeline_stats(self, test_client, viewer):
        """Viewer can access /monitoring/pipeline-stats."""
        resp = await test_client.get("/api/v1/monitoring/pipeline-stats")
        assert resp.status_code == 200

    async def test_executive_accesses_analytics(self, test_client, executive):
        """Executive role can access analytics data endpoint."""
        resp = await test_client.get("/api/v1/analytics/data")
        assert resp.status_code == 200

    async def test_viewer_blocked_from_analytics(self, test_client, viewer):
        """Viewer role cannot access analytics — expects 403."""
        resp = await test_client.get("/api/v1/analytics/data")
        assert resp.status_code == 403

    async def test_executive_exports_analytics_json(self, test_client, executive):
        """Executive can export analytics data as JSON."""
        resp = await test_client.get(
            "/api/v1/analytics/export-data?format=json&time_range=7d"
        )
        assert resp.status_code == 200

    async def test_developer_accesses_cleanup_stats(self, test_client, developer):
        """Developer can access admin cleanup stats endpoint."""
        resp = await test_client.get("/api/v1/admin/cleanup/stats")
        assert resp.status_code == 200

    async def test_designer_blocked_from_cleanup_stats(self, test_client, designer):
        """Designer role is blocked from the admin cleanup endpoint."""
        resp = await test_client.get("/api/v1/admin/cleanup/stats")
        assert resp.status_code == 403

    async def test_viewer_can_view_transformation_metrics(self, test_client, viewer):
        """Viewer can access transformation metrics (read-only endpoint)."""
        resp = await test_client.get("/api/v1/transformations/metrics")
        assert resp.status_code == 200
