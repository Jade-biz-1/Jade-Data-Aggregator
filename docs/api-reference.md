# API Reference Documentation

**Data Aggregator Platform - REST API**

**Version**: 1.2 (Phase 9)
**Base URL**: `http://localhost:8001/api/v1`
**Last Updated**: October 17, 2025

---

## Overview

The Data Aggregator Platform provides a comprehensive REST API with **212 endpoints** across **26 service routers**. All endpoints require authentication unless explicitly marked as public.

### Phase 8 Updates (October 13, 2025) ✨ **NEW**

This version includes Enhanced RBAC and System Maintenance features:

**Role Management (5 endpoints):**
- 6 granular roles: Admin, Developer, Designer, Executor, Executive, Viewer
- Role-based navigation and feature access
- 40+ granular permissions

**System Maintenance (11 endpoints):**
- Clean activity logs, temp files, execution logs
- Database vacuum and optimization
- Orphaned data cleanup
- Expired session management
- Automated cleanup scheduling
- Cleanup history and estimation

**Production Safeguards (2 endpoints):**
- Developer role production controls
- Temporary approval system with auto-expiration

### Phase 7G Updates (October 10, 2025)

Enhanced user management features:
- Change password functionality for all users
- Admin user management with activate/deactivate capabilities
- Activity logging and audit trail
- Inactive user restrictions

### Authentication

All API requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

To obtain a token, use the `/auth/login` endpoint.

### Response Format

All API responses follow this structure:

```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "Optional message",
  "errors": [ ... ] // Only for error responses
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

## API Endpoints by Service

### 1. Authentication (`/auth`)

#### POST `/auth/login`
- **Description**: User login
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: JWT access token and refresh token

#### POST `/auth/register`
- **Description**: Register new user
- **Public**: Yes
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }
  ```

#### POST `/auth/refresh`
- **Description**: Refresh access token
- **Request Body**: `{ "refresh_token": "..." }`

#### POST `/auth/reset-password`
- **Description**: Request password reset
- **Public**: Yes
- **Request Body**: `{ "email": "user@example.com" }`

#### POST `/auth/verify-email`
- **Description**: Verify email address
- **Public**: Yes
- **Request Body**: `{ "token": "..." }`

#### POST `/auth/change-password` ✨ NEW
- **Description**: Change current user's password
- **Requires Authentication**: Yes
- **Request Body**:
  ```json
  {
    "current_password": "old_password",
    "new_password": "new_password"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Password changed successfully"
  }
  ```
- **Errors**:
  - `400`: Current password is incorrect
  - `422`: New password doesn't meet requirements (min 8 chars, letters + numbers)

#### POST `/auth/2fa/setup` ✨ NEW (Phase 9B)
- **Description**: Setup Two-Factor Authentication for the current user
- **Requires Authentication**: Yes
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "otp_secret": "...",
      "otp_auth_url": "otpauth://totp/..."
    }
  }
  ```

#### POST `/auth/2fa/verify` ✨ NEW (Phase 9B)
- **Description**: Verify and enable 2FA with an OTP code

#### POST `/auth/2fa/disable` ✨ NEW (Phase 9B)
- **Description**: Disable 2FA for the current user

---

### 2. Users (`/users`)

#### GET `/users`
- **Description**: List all users (Admin only)
- **Query Parameters**:
  - `skip`: Offset (default: 0)
  - `limit`: Page size (default: 100)
  - `role`: Filter by role

#### POST `/users`
- **Description**: Create new user (Admin only)
- **Request Body**: User object with email, password, full_name, role

#### GET `/users/{user_id}`
- **Description**: Get user by ID
- **Permissions**: Admin or own profile

#### PUT `/users/{user_id}`
- **Description**: Update user
- **Permissions**: Admin or own profile

#### DELETE `/users/{user_id}`
- **Description**: Delete user (Admin only)

#### GET `/users/me`
- **Description**: Get current user profile

#### POST `/users/{user_id}/activate` ✨ NEW
- **Description**: Activate a user account (Admin only)
- **Permissions**: Admin
- **Response**:
  ```json
  {
    "status": "success",
    "message": "User activated successfully",
    "data": {
      "user_id": 123,
      "is_active": true
    }
  }
  ```

#### POST `/users/{user_id}/deactivate` ✨ NEW
- **Description**: Deactivate a user account (Admin only)
- **Permissions**: Admin
- **Response**:
  ```json
  {
    "status": "success",
    "message": "User deactivated successfully",
    "data": {
      "user_id": 123,
      "is_active": false
    }
  }
  ```
- **Notes**:
  - Deactivated users cannot access API or protected routes
  - Deactivated users will see "Account Inactive" page when they try to login

#### POST `/users/{user_id}/reset-password` ✨ NEW
- **Description**: Reset user password (Admin only, generates temporary password)
- **Permissions**: Admin
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Password reset successfully",
    "data": {
      "temporary_password": "TempPass123!"
    }
  }
  ```
- **Notes**:
  - Generates a secure temporary password
  - Admin receives the temporary password in response
  - User must change password on next login
  - Activity is logged for audit trail

#### GET `/users/me/api-keys` ✨ NEW (Phase 9C)
- **Description**: Get all API keys for the current user

#### POST `/users/me/api-keys` ✨ NEW (Phase 9C)
- **Description**: Create a new API key
- **Request Body**: `{ "name": "My Key", "permissions": ["read"] }`

#### DELETE `/users/me/api-keys/{key_id}` ✨ NEW (Phase 9C)
- **Description**: Revoke an API key

---

### 3. Webhooks (`/webhooks`) ✨ NEW (Phase 9C)


---

### 4. Pipelines (`/pipelines`)

#### GET `/pipelines`
- **Description**: List all pipelines
- **Query Parameters**: `skip`, `limit`, `is_active`

#### POST `/pipelines`
- **Description**: Create new pipeline
- **Request Body**:
  ```json
  {
    "name": "My Pipeline",
    "description": "Pipeline description",
    "source_config": { ... },
    "transformation_config": { ... },
    "destination_config": { ... },
    "schedule": "0 0 * * *"
  }
  ```

#### GET `/pipelines/{pipeline_id}`
- **Description**: Get pipeline details

#### PUT `/pipelines/{pipeline_id}`
- **Description**: Update pipeline

#### DELETE `/pipelines/{pipeline_id}`
- **Description**: Delete pipeline

#### POST `/pipelines/{pipeline_id}/execute`
- **Description**: Execute pipeline manually

#### GET `/pipelines/{pipeline_id}/history`
- **Description**: Get execution history

#### GET `/pipelines/{pipeline_id}/status`
- **Description**: Get current execution status

---

### 5. Pipeline Builder (`/pipeline-builder`)

#### POST `/pipeline-builder/validate`
- **Description**: Validate pipeline definition
- **Request Body**: Visual pipeline JSON (nodes & edges)

#### POST `/pipeline-builder/save`
- **Description**: Save visual pipeline
- **Request Body**: Pipeline definition with visual layout

#### GET `/pipeline-builder/{pipeline_id}`
- **Description**: Get visual pipeline definition

---

### 6. Pipeline Templates (`/pipeline-templates`)

#### GET `/pipeline-templates`
- **Description**: List all templates
- **Query Parameters**: `category`, `is_builtin`

#### GET `/pipeline-templates/builtin`
- **Description**: Get built-in templates only

#### GET `/pipeline-templates/popular`
- **Description**: Get most used templates

#### GET `/pipeline-templates/by-category`
- **Description**: Get templates grouped by category

#### POST `/pipeline-templates`
- **Description**: Create custom template

#### GET `/pipeline-templates/{template_id}`
- **Description**: Get template details

#### POST `/pipeline-templates/{template_id}/use`
- **Description**: Create pipeline from template

---

### 7. Pipeline Versions (`/pipeline-versions`)

#### GET `/pipeline-versions/pipelines/{pipeline_id}/versions`
- **Description**: List all versions for a pipeline

#### GET `/pipeline-versions/pipelines/{pipeline_id}/versions/summary`
- **Description**: Get version summary

#### GET `/pipeline-versions/pipelines/{pipeline_id}/versions/active`
- **Description**: Get active version

#### POST `/pipeline-versions/pipelines/{pipeline_id}/versions`
- **Description**: Create new version
- **Request Body**: `{ "version_name": "...", "change_description": "..." }`

#### POST `/pipeline-versions/versions/{version_id}/activate`
- **Description**: Set version as active

#### POST `/pipeline-versions/versions/{version_id}/restore`
- **Description**: Restore pipeline to this version

#### GET `/pipeline-versions/versions/{v1}/compare/{v2}`
- **Description**: Compare two versions

---

### 8. Connectors (`/connectors`)

#### GET `/connectors`
- **Description**: List all connectors

#### POST `/connectors`
- **Description**: Create new connector
- **Request Body**:
  ```json
  {
    "name": "My Database",
    "connector_type": "postgresql",
    "config": {
      "host": "localhost",
      "port": 5432,
      "database": "mydb",
      "username": "user",
      "password": "pass"
    }
  }
  ```

#### GET `/connectors/{connector_id}`
- **Description**: Get connector details

#### PUT `/connectors/{connector_id}`
- **Description**: Update connector

#### DELETE `/connectors/{connector_id}`
- **Description**: Delete connector

#### POST `/connectors/{connector_id}/test`
- **Description**: Test connector connection

---

### 9. Transformations (`/transformations`)

#### GET `/transformations`
- **Description**: List all transformations

#### POST `/transformations`
- **Description**: Create transformation

#### GET `/transformations/{transformation_id}`
- **Description**: Get transformation details

#### PUT `/transformations/{transformation_id}`
- **Description**: Update transformation

#### DELETE `/transformations/{transformation_id}`
- **Description**: Delete transformation

---

### 10. Transformation Functions (`/transformation-functions`)

#### GET `/transformation-functions`
- **Description**: List all transformation functions

#### GET `/transformation-functions/builtin`
- **Description**: Get built-in functions

#### GET `/transformation-functions/by-category`
- **Description**: Get functions grouped by category

#### POST `/transformation-functions`
- **Description**: Create custom function
- **Request Body**:
  ```json
  {
    "name": "my_function",
    "display_name": "My Function",
    "description": "Description",
    "category": "custom",
    "function_code": "def my_function(data): ...",
    "parameters": [ ... ]
  }
  ```

#### GET `/transformation-functions/{function_id}`
- **Description**: Get function details

#### POST `/transformation-functions/{function_id}/test`
- **Description**: Test function with sample data

---

### 11. Monitoring (`/monitoring`)

#### GET `/monitoring/stats`
- **Description**: Get overall statistics

#### GET `/monitoring/pipelines`
- **Description**: Get pipeline monitoring data

#### GET `/monitoring/performance`
- **Description**: Get performance metrics

#### GET `/monitoring/alerts`
- **Description**: Get active alerts

---

### 12. Analytics (`/analytics`)

#### GET `/analytics/data`
- **Description**: Get analytics data
- **Query Parameters**: `start_date`, `end_date`, `metric`

#### GET `/analytics/timeseries`
- **Description**: Get time-series data

#### GET `/analytics/trends`
- **Description**: Get trend analysis

#### POST `/analytics/custom-query`
- **Description**: Execute custom analytics query

---

### 13. Advanced Analytics (`/analytics/advanced`)

#### POST `/analytics/advanced/aggregate`
- **Description**: Advanced data aggregation

#### POST `/analytics/advanced/export`
- **Description**: Export analytics data
- **Query Parameters**: `format` (json, csv, excel)

#### POST `/analytics/advanced/schedule`
- **Description**: Schedule analytics report

---

### 14. Schema (`/schema`)

#### POST `/schema/introspect`
- **Description**: Introspect data source schema
- **Request Body**:
  ```json
  {
    "connector_id": 123,
    "source_type": "database" | "api" | "file"
  }
  ```

#### POST `/schema/map`
- **Description**: Create field mappings

#### GET `/schema/mappings/{mapping_id}`
- **Description**: Get schema mapping

#### POST `/schema/compare`
- **Description**: Compare two schemas

#### POST `/schema/generate-transformation`
- **Description**: Generate transformation code from mapping

---

### 15. Configuration (`/configuration`)

#### GET `/configuration/schemas`
- **Description**: Get all configuration schemas

#### GET `/configuration/schemas/by-category`
- **Description**: Get schemas by category

#### GET `/configuration/schemas/{connector_type}`
- **Description**: Get form metadata for connector type

#### GET `/configuration/schemas/{connector_type}/template`
- **Description**: Get configuration template

#### POST `/configuration/validate`
- **Description**: Validate configuration
- **Request Body**: `{ "connector_type": "...", "configuration": { ... } }`

#### POST `/configuration/test-connection`
- **Description**: Test connection with configuration

#### POST `/configuration/preview`
- **Description**: Preview configuration (sensitive data masked)

---

### 16. Dashboard (`/dashboard`)

#### GET `/dashboard/stats`
- **Description**: Get dashboard statistics

#### GET `/dashboard/activity`
- **Description**: Get recent activity

#### GET `/dashboard/system-status`
- **Description**: Get system status

---

### 17. Logs (`/logs`)

#### POST `/logs`
- **Description**: Create log entry

#### POST `/logs/search`
- **Description**: Search logs
- **Request Body**:
  ```json
  {
    "level": "error",
    "start_date": "2025-10-01",
    "end_date": "2025-10-03",
    "search_term": "error message"
  }
  ```

#### GET `/logs/correlation/{correlation_id}`
- **Description**: Get all logs for a correlation ID

#### GET `/logs/errors/recent`
- **Description**: Get recent errors

#### GET `/logs/statistics`
- **Description**: Get log statistics

#### GET `/logs/trends/errors`
- **Description**: Get error trends

#### POST `/logs/archive`
- **Description**: Archive old logs

---

### 18. Alerts (`/alerts`)

#### POST `/alerts/rules`
- **Description**: Create alert rule
- **Request Body**:
  ```json
  {
    "name": "High Error Rate",
    "metric": "error_rate",
    "threshold": 5.0,
    "operator": "gt",
    "severity": "high"
  }
  ```

#### POST `/alerts/rules/{rule_id}/evaluate`
- **Description**: Evaluate alert rule

#### GET `/alerts`
- **Description**: Get active alerts

#### POST `/alerts/{alert_id}/acknowledge`
- **Description**: Acknowledge alert

#### POST `/alerts/{alert_id}/resolve`
- **Description**: Resolve alert

#### GET `/alerts/statistics`
- **Description**: Get alert statistics

#### POST `/alerts/escalation-policies`
- **Description**: Create escalation policy

---

### 19. Search (`/search`)

#### GET `/search`
- **Description**: Global search across all entities
- **Query Parameters**:
  - `q`: Search query (required)
  - `entity_types`: Comma-separated list (pipelines, connectors, etc.)
  - `limit`: Results limit (default: 50)

#### GET `/search/suggestions`
- **Description**: Get search suggestions for autocomplete
- **Query Parameters**: `q` (partial search term)

#### GET `/search/pipelines`
- **Description**: Search pipelines only

#### GET `/search/connectors`
- **Description**: Search connectors only

#### GET `/search/users`
- **Description**: Search users only

---

### 20. Health (`/health`)

#### GET `/health`
- **Description**: Comprehensive health check
- **Public**: Yes

#### GET `/health/live`
- **Description**: Liveness probe (Kubernetes)
- **Public**: Yes

#### GET `/health/ready`
- **Description**: Readiness probe (Kubernetes)
- **Public**: Yes

#### GET `/health/metrics`
- **Description**: Prometheus metrics
- **Public**: Yes

#### GET `/health/database`
- **Description**: Database health check

#### GET `/health/cache`
- **Description**: Cache health check

#### GET `/health/system`
- **Description**: System resource health

---

### 21. WebSocket (`/websocket`)

#### WS `/websocket/pipeline-status`
- **Description**: WebSocket connection for real-time pipeline status
- **Protocol**: WebSocket
- **Authentication**: JWT in query parameter `?token=...`

#### WS `/websocket/metrics`
- **Description**: WebSocket connection for real-time metrics

---

### 22. Preferences (`/preferences`)

#### GET `/preferences`
- **Description**: Get user preferences

#### PUT `/preferences`
- **Description**: Update user preferences
- **Request Body**:
  ```json
  {
    "theme": "dark" | "light",
    "language": "en",
    "timezone": "UTC",
    "notifications_enabled": true
  }
  ```

#### GET `/preferences/widgets`
- **Description**: Get widget preferences

#### PUT `/preferences/widgets/{widget_id}`
- **Description**: Update widget preferences

---

### 23. Dashboards (`/dashboards`)

#### GET `/dashboards/layouts`
- **Description**: Get all dashboard layouts

#### POST `/dashboards/layouts`
- **Description**: Create dashboard layout
- **Request Body**:
  ```json
  {
    "name": "My Dashboard",
    "layout_config": { ... },
    "is_default": false
  }
  ```

#### PUT `/dashboards/layouts/{layout_id}`
- **Description**: Update dashboard layout

#### POST `/dashboards/layouts/{layout_id}/clone`
- **Description**: Clone dashboard layout

---

### 24. Admin Activity Logs (`/admin/activity-logs`) ✨ NEW

#### GET `/admin/activity-logs`
- **Description**: Get activity logs with filtering (Admin only)
- **Permissions**: Admin
- **Query Parameters**:
  - `user_id`: Filter by user ID (optional)
  - `action`: Filter by action type (optional)
  - `start_date`: Filter by start date (optional)
  - `end_date`: Filter by end date (optional)
  - `skip`: Offset (default: 0)
  - `limit`: Page size (default: 100)
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "user_id": 123,
        "username": "john.doe",
        "action": "user.login",
        "details": "Successful login",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "timestamp": "2025-10-10T10:30:00Z"
      }
    ],
    "total": 150,
    "skip": 0,
    "limit": 100
  }
  ```
- **Activity Types**:
  - `user.login` - User logged in
  - `user.logout` - User logged out
  - `user.login.failed` - Failed login attempt
  - `user.created` - User account created
  - `user.updated` - User account updated
  - `user.deleted` - User account deleted
  - `user.activated` - User account activated
  - `user.deactivated` - User account deactivated
  - `password.changed` - Password changed
  - `password.reset` - Password reset by admin
  - `role.changed` - User role changed

#### GET `/admin/activity-logs/{user_id}`
- **Description**: Get activity logs for a specific user (Admin only)
- **Permissions**: Admin
- **Query Parameters**: Same as above (except user_id)
- **Response**: Same format as GET `/admin/activity-logs`

---

### 25. Role Management (`/roles`) ✨ PHASE 8

#### GET `/roles`
- **Description**: Get all available roles
- **Requires Authentication**: Yes
- **Permissions**: Authenticated users
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "name": "admin",
        "display_name": "Administrator",
        "level": 100,
        "description": "Full system access"
      },
      {
        "name": "developer",
        "display_name": "Developer",
        "level": 90,
        "description": "Development and testing access"
      },
      {
        "name": "designer",
        "display_name": "Designer",
        "level": 50,
        "description": "Pipeline and workflow design"
      },
      {
        "name": "executor",
        "display_name": "Executor",
        "level": 40,
        "description": "Pipeline execution and monitoring"
      },
      {
        "name": "executive",
        "display_name": "Executive",
        "level": 30,
        "description": "Analytics and BI access"
      },
      {
        "name": "viewer",
        "display_name": "Viewer",
        "level": 10,
        "description": "Read-only access"
      }
    ]
  }
  ```

#### GET `/roles/{role_name}`
- **Description**: Get specific role details with full permission list
- **Requires Authentication**: Yes
- **Permissions**: Authenticated users
- **Path Parameters**: `role_name` (admin, developer, designer, executor, executive, viewer)
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "name": "designer",
      "display_name": "Designer",
      "level": 50,
      "description": "Pipeline and workflow design",
      "permissions": {
        "pipelines": {
          "view": true,
          "create": true,
          "edit": true,
          "delete": true,
          "execute": true
        },
        "connectors": {
          "view": true,
          "create": true,
          "edit": true,
          "delete": true
        },
        "transformations": {
          "view": true,
          "create": true,
          "edit": true,
          "delete": true,
          "execute": true
        }
      }
    }
  }
  ```

#### GET `/roles/navigation/items`
- **Description**: Get navigation items visibility for current user based on their role
- **Requires Authentication**: Yes
- **Permissions**: Authenticated users
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "dashboard": true,
      "pipelines": true,
      "connectors": true,
      "transformations": true,
      "monitoring": false,
      "analytics": false,
      "users": false,
      "maintenance": false
    }
  }
  ```
- **Notes**: Response varies based on user's role

#### GET `/roles/features/access`
- **Description**: Get feature access permissions for current user
- **Requires Authentication**: Yes
- **Permissions**: Authenticated users
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "role": "designer",
      "features": {
        "pipelines": {
          "view": true,
          "create": true,
          "edit": true,
          "delete": true,
          "execute": true
        },
        "connectors": {
          "view": true,
          "create": true,
          "edit": true,
          "delete": true
        },
        "users": {
          "view": false,
          "create": false,
          "edit": false,
          "delete": false
        }
      },
      "navigation": {
        "dashboard": true,
        "pipelines": true,
        "monitoring": false,
        "users": false
      }
    }
  }
  ```
- **Use Case**: Frontend uses this to show/hide UI elements based on permissions

#### GET `/roles/{role_name}/permissions`
- **Description**: Get full permissions object for a specific role
- **Requires Authentication**: Yes
- **Permissions**: Admin, Developer
- **Path Parameters**: `role_name`
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "role": "executor",
      "permissions": {
        "pipelines": {
          "view": true,
          "create": false,
          "edit": false,
          "delete": false,
          "execute": true
        },
        "monitoring": {
          "view": true
        }
      }
    }
  }
  ```

---

### 26. System Cleanup (`/admin/cleanup`) ✨ PHASE 8

#### GET `/admin/cleanup/stats`
- **Description**: Get system statistics for maintenance dashboard
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "database": {
        "total_size_mb": 1024.5,
        "table_count": 21,
        "last_vacuum": "2025-10-12T02:00:00Z"
      },
      "records": {
        "users": 150,
        "pipelines": 45,
        "connectors": 30,
        "activity_logs": 50000,
        "execution_logs": 100000,
        "orphaned_records": 25
      },
      "temp_files": {
        "count": 500,
        "total_size_mb": 250.3
      },
      "cache": {
        "keys": 1000,
        "memory_mb": 128.5
      }
    }
  }
  ```

#### POST `/admin/cleanup/activity-logs`
- **Description**: Clean old activity logs based on retention period
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "retention_days": 90
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_activity_logs",
      "records_deleted": 15000,
      "space_freed_mb": 50.2,
      "duration_seconds": 5.3,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### POST `/admin/cleanup/temp-files`
- **Description**: Clean temporary files older than retention period
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_temp_files",
      "files_deleted": 500,
      "space_freed_mb": 250.3,
      "duration_seconds": 2.1,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### POST `/admin/cleanup/orphaned-data`
- **Description**: Clean orphaned records (records without parent references)
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_orphaned_data",
      "records_deleted": 25,
      "affected_tables": ["pipeline_runs", "transformations"],
      "duration_seconds": 1.5,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### POST `/admin/cleanup/execution-logs`
- **Description**: Clean old pipeline execution logs
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "retention_days": 30
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_execution_logs",
      "records_deleted": 75000,
      "space_freed_mb": 120.5,
      "duration_seconds": 8.7,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### POST `/admin/cleanup/database-vacuum`
- **Description**: Vacuum and optimize database (VACUUM ANALYZE)
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "database_vacuum",
      "tables_processed": 21,
      "space_reclaimed_mb": 150.2,
      "duration_seconds": 45.3,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```
- **Notes**: This operation can take several minutes depending on database size

#### POST `/admin/cleanup/expired-sessions`
- **Description**: Clean expired Redis sessions
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_expired_sessions",
      "sessions_deleted": 250,
      "memory_freed_mb": 5.3,
      "duration_seconds": 0.5,
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### POST `/admin/cleanup/all`
- **Description**: Run all cleanup operations sequentially
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "retention_days": 30
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "operation": "cleanup_all",
      "total_records_deleted": 90275,
      "total_files_deleted": 500,
      "total_space_freed_mb": 576.5,
      "total_duration_seconds": 63.4,
      "operations": [
        {
          "name": "activity_logs",
          "records_deleted": 15000,
          "space_freed_mb": 50.2
        },
        {
          "name": "temp_files",
          "files_deleted": 500,
          "space_freed_mb": 250.3
        },
        {
          "name": "orphaned_data",
          "records_deleted": 25,
          "space_freed_mb": 0.5
        },
        {
          "name": "execution_logs",
          "records_deleted": 75000,
          "space_freed_mb": 120.5
        },
        {
          "name": "database_vacuum",
          "space_reclaimed_mb": 150.2
        },
        {
          "name": "expired_sessions",
          "sessions_deleted": 250,
          "memory_freed_mb": 5.3
        }
      ],
      "timestamp": "2025-10-13T10:30:00Z"
    }
  }
  ```

#### GET `/admin/cleanup/estimate/{cleanup_type}`
- **Description**: Estimate impact of cleanup operation without executing
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Path Parameters**: `cleanup_type` (activity-logs, temp-files, orphaned-data, execution-logs)
- **Query Parameters**: `retention_days` (optional, for applicable types)
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "cleanup_type": "activity_logs",
      "estimated_records": 15000,
      "estimated_space_mb": 50.2,
      "estimated_duration_seconds": 5.0,
      "retention_days": 90
    }
  }
  ```

#### GET `/admin/cleanup/history`
- **Description**: Get cleanup operation history with pagination
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 50)
  - `start_date`: Filter by start date (optional)
  - `end_date`: Filter by end date (optional)
  - `operation`: Filter by operation type (optional)
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 123,
        "operation": "cleanup_all",
        "user_id": 1,
        "username": "admin",
        "records_deleted": 90275,
        "space_freed_mb": 576.5,
        "duration_seconds": 63.4,
        "status": "success",
        "timestamp": "2025-10-13T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 50
  }
  ```

#### GET `/admin/cleanup/schedule`
- **Description**: Get current cleanup schedule configuration
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "enabled": true,
      "schedule": "0 2 * * *",
      "retention_periods": {
        "activity_logs_days": 90,
        "execution_logs_days": 30,
        "temp_files_hours": 24
      },
      "next_run": "2025-10-14T02:00:00Z",
      "last_run": "2025-10-13T02:00:00Z",
      "last_run_status": "success"
    }
  }
  ```

#### PUT `/admin/cleanup/schedule`
- **Description**: Update cleanup schedule configuration
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "enabled": true,
    "schedule": "0 2 * * *",
    "retention_periods": {
      "activity_logs_days": 90,
      "execution_logs_days": 30,
      "temp_files_hours": 24
    }
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "enabled": true,
      "schedule": "0 2 * * *",
      "retention_periods": {
        "activity_logs_days": 90,
        "execution_logs_days": 30,
        "temp_files_hours": 24
      },
      "next_run": "2025-10-14T02:00:00Z"
    },
    "message": "Cleanup schedule updated successfully"
  }
  ```

---

### 27. System Settings (`/admin/settings`) ✨ PHASE 8

#### GET `/admin/settings/dev-role-production`
- **Description**: Get developer role production environment setting
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "allowed": false,
      "expires_at": null,
      "environment": "production"
    }
  }
  ```
- **Notes**: Returns whether developer role is allowed in production and when it expires

#### PUT `/admin/settings/dev-role-production`
- **Description**: Allow developer role in production temporarily (security-sensitive)
- **Requires Authentication**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "allow": true,
    "duration_hours": 24
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "allowed": true,
      "expires_at": "2025-10-14T10:30:00Z",
      "duration_hours": 24,
      "environment": "production"
    },
    "message": "Developer role temporarily allowed in production. Auto-expires in 24 hours."
  }
  ```
- **Security Notes**:
  - Use with extreme caution in production
  - Automatically expires after specified duration (default: 24 hours)
  - Warning banner displayed to developer role users
  - All developer role activity logged
  - Recommended for temporary troubleshooting only

---

### 28. Pipeline Execution (`/pipelines/{pipeline_id}/...`)

Additional pipeline execution endpoints under the pipeline routes.

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **Admin users**: 5000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633024800
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Insufficient permissions |
| `VAL_001` | Validation error |
| `RES_001` | Resource not found |
| `SYS_001` | System error |
| `DB_001` | Database error |
| `CONN_001` | Connection error |

---

## Interactive API Documentation

For interactive API documentation and testing:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

---

## SDK Examples

### Python

```python
import requests

API_BASE = "http://localhost:8001/api/v1"
TOKEN = "your_jwt_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# List pipelines
response = requests.get(f"{API_BASE}/pipelines", headers=headers)
pipelines = response.json()

# Create connector
connector_data = {
    "name": "My PostgreSQL DB",
    "connector_type": "postgresql",
    "config": {
        "host": "localhost",
        "port": 5432,
        "database": "mydb",
        "username": "user",
        "password": "pass"
    }
}
response = requests.post(f"{API_BASE}/connectors", json=connector_data, headers=headers)
connector = response.json()
```

### JavaScript

```javascript
const API_BASE = 'http://localhost:8001/api/v1';
const TOKEN = 'your_jwt_token';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// List pipelines
const response = await fetch(`${API_BASE}/pipelines`, { headers });
const pipelines = await response.json();

// Create connector
const connectorData = {
  name: 'My PostgreSQL DB',
  connector_type: 'postgresql',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    username: 'user',
    password: 'pass'
  }
};

const createResponse = await fetch(`${API_BASE}/connectors`, {
  method: 'POST',
  headers,
  body: JSON.stringify(connectorData)
});
const connector = await createResponse.json();
```

---

## Webhook Support

The platform supports webhooks for event notifications. Configure webhooks in the admin panel or via API.

### Webhook Events

- `pipeline.started`
- `pipeline.completed`
- `pipeline.failed`
- `connector.created`
- `alert.triggered`
- `alert.resolved`

### Webhook Payload

```json
{
  "event": "pipeline.completed",
  "timestamp": "2025-10-03T10:30:00Z",
  "data": {
    "pipeline_id": 123,
    "status": "success",
    "duration_seconds": 45
  }
}
```

---

**For questions or support, please refer to the main documentation or contact the development team.**