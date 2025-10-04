# API Reference Documentation

**Data Aggregator Platform - REST API**

**Version**: 1.0
**Base URL**: `http://localhost:8001/api/v1`
**Last Updated**: October 3, 2025

---

## Overview

The Data Aggregator Platform provides a comprehensive REST API with **179 endpoints** across **23 service routers**. All endpoints require authentication unless explicitly marked as public.

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

---

### 3. Pipelines (`/pipelines`)

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

### 4. Pipeline Builder (`/pipeline-builder`)

#### POST `/pipeline-builder/validate`
- **Description**: Validate pipeline definition
- **Request Body**: Visual pipeline JSON (nodes & edges)

#### POST `/pipeline-builder/save`
- **Description**: Save visual pipeline
- **Request Body**: Pipeline definition with visual layout

#### GET `/pipeline-builder/{pipeline_id}`
- **Description**: Get visual pipeline definition

---

### 5. Pipeline Templates (`/pipeline-templates`)

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

### 6. Pipeline Versions (`/pipeline-versions`)

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

### 7. Connectors (`/connectors`)

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

### 8. Transformations (`/transformations`)

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

### 9. Transformation Functions (`/transformation-functions`)

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

### 10. Monitoring (`/monitoring`)

#### GET `/monitoring/stats`
- **Description**: Get overall statistics

#### GET `/monitoring/pipelines`
- **Description**: Get pipeline monitoring data

#### GET `/monitoring/performance`
- **Description**: Get performance metrics

#### GET `/monitoring/alerts`
- **Description**: Get active alerts

---

### 11. Analytics (`/analytics`)

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

### 12. Advanced Analytics (`/analytics/advanced`)

#### POST `/analytics/advanced/aggregate`
- **Description**: Advanced data aggregation

#### POST `/analytics/advanced/export`
- **Description**: Export analytics data
- **Query Parameters**: `format` (json, csv, excel)

#### POST `/analytics/advanced/schedule`
- **Description**: Schedule analytics report

---

### 13. Schema (`/schema`)

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

### 14. Configuration (`/configuration`)

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

### 15. Dashboard (`/dashboard`)

#### GET `/dashboard/stats`
- **Description**: Get dashboard statistics

#### GET `/dashboard/activity`
- **Description**: Get recent activity

#### GET `/dashboard/system-status`
- **Description**: Get system status

---

### 16. Logs (`/logs`)

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

### 17. Alerts (`/alerts`)

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

### 18. Search (`/search`)

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

### 19. Health (`/health`)

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

### 20. WebSocket (`/websocket`)

#### WS `/websocket/pipeline-status`
- **Description**: WebSocket connection for real-time pipeline status
- **Protocol**: WebSocket
- **Authentication**: JWT in query parameter `?token=...`

#### WS `/websocket/metrics`
- **Description**: WebSocket connection for real-time metrics

---

### 21. Preferences (`/preferences`)

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

### 22. Dashboards (`/dashboards`)

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

### 23. Pipeline Execution (`/pipelines/{pipeline_id}/...`)

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
