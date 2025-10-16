# Phase 8 API Documentation Updates

**Date**: October 12, 2025
**Version**: 1.1.0
**Phase**: 8 - Enhanced RBAC & System Maintenance

## Overview

Phase 8 introduces a comprehensive 6-role RBAC system and system maintenance endpoints. This document details the new roles, permissions, and API endpoints added in this phase.

---

## Table of Contents

1. [Role-Based Access Control (RBAC)](#role-based-access-control)
2. [Role Permissions Matrix](#role-permissions-matrix)
3. [New API Endpoints](#new-api-endpoints)
4. [Updated Endpoint Protection](#updated-endpoint-protection)
5. [Authentication & Authorization](#authentication--authorization)
6. [Error Codes](#error-codes)

---

## Role-Based Access Control

### The 6-Role System

Phase 8 implements a granular 6-role RBAC system:

| Role | Level | Description | Primary Use Case |
|------|-------|-------------|------------------|
| **Admin** | 6 | Full system administration | System administrators |
| **Developer** | 5 | Near-admin access for development | Development & debugging |
| **Designer** | 3 | Pipeline design & configuration | Data engineers |
| **Executor** | 2 | Pipeline execution & monitoring | Operations team |
| **Executive** | 4 | Analytics & reporting access | Business stakeholders |
| **Viewer** | 1 | Read-only access | Stakeholders, auditors |

### Role Assignment Rules

- **New users default to Viewer role**
- Only Admin can assign Admin or Developer roles
- Developer role can assign Designer, Executor, Executive, and Viewer roles
- Role changes take effect immediately
- Users can have only one role at a time

---

## Role Permissions Matrix

### Comprehensive Permissions Table

| Feature | Admin | Developer | Designer | Executor | Executive | Viewer |
|---------|:-----:|:---------:|:--------:|:--------:|:---------:|:------:|
| **Pipelines** |
| View Pipelines | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Execute Pipelines | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Connectors** |
| View Connectors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Connectors | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Connectors | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Connectors | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Test Connections | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Transformations** |
| View Transformations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Transformations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Transformations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Transformations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Monitoring** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Monitoring | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Logs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Alerts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Alerts | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Analytics** |
| View Analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create Reports | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **User Management** |
| View Users | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Reset Passwords | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Activate/Deactivate | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ✅** | ❌ | ❌ | ❌ | ❌ |
| **System** |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Maintenance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Database Cleanup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Activity Logs | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage Cleanup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

\* **Developer restrictions**: Cannot modify admin user
\** **Developer restrictions**: Cannot assign Admin or Developer roles

---

## New API Endpoints

### Role Management Endpoints

#### GET /api/v1/roles/
Get all available roles with descriptions.

**Authorization**: All authenticated users

**Response**:
```json
{
  "roles": [
    {
      "name": "admin",
      "title": "Administrator",
      "description": "Full system access",
      "level": 6
    },
    ...
  ],
  "total": 6
}
```

#### GET /api/v1/roles/{role}/permissions
Get permissions for a specific role.

**Authorization**: All authenticated users

**Response**:
```json
{
  "name": "designer",
  "title": "Designer",
  "permissions": ["view_pipelines", "create_pipelines", ...],
  "level": 3
}
```

#### GET /api/v1/roles/navigation/items
Get navigation items visible to current user based on their role.

**Authorization**: All authenticated users

**Response**:
```json
{
  "user_id": 1,
  "role": "designer",
  "navigation": {
    "dashboard": true,
    "pipelines": true,
    "connectors": true,
    "users": false,
    "analytics": false,
    "maintenance": false
  }
}
```

### System Cleanup Endpoints

All cleanup endpoints require **Developer or Admin** role.

#### POST /api/v1/admin/cleanup/activity-logs
Clean old activity logs.

**Query Parameters**:
- `days_to_keep` (int, default: 90): Days to retain logs

**Response**:
```json
{
  "success": true,
  "records_deleted": 1500,
  "days_kept": 90,
  "cutoff_date": "2025-07-14T00:00:00Z"
}
```

#### POST /api/v1/admin/cleanup/orphaned-data
Clean orphaned pipeline runs and data.

**Response**:
```json
{
  "success": true,
  "records_deleted": 25,
  "type": "orphaned_pipeline_runs"
}
```

#### POST /api/v1/admin/cleanup/temp-files
Clean temporary files.

**Query Parameters**:
- `max_age_hours` (int, default: 24): Maximum age in hours

**Response**:
```json
{
  "success": true,
  "files_deleted": 150,
  "space_freed_mb": 245.5,
  "max_age_hours": 24
}
```

#### POST /api/v1/admin/cleanup/database-vacuum
Run VACUUM ANALYZE on database.

**Response**:
```json
{
  "success": true,
  "message": "Database vacuum completed"
}
```

#### POST /api/v1/admin/cleanup/all
Run all cleanup operations.

**Query Parameters**:
- `activity_log_days` (int, default: 90)
- `execution_log_days` (int, default: 30)
- `temp_file_hours` (int, default: 24)

**Response**:
```json
{
  "started_at": "2025-10-12T10:00:00Z",
  "completed_at": "2025-10-12T10:05:30Z",
  "operations": {
    "activity_logs": {...},
    "orphaned_data": {...},
    "temp_files": {...},
    "execution_logs": {...},
    "expired_sessions": {...},
    "database_vacuum": {...}
  },
  "summary": {
    "total_records_deleted": 2500,
    "total_files_deleted": 150,
    "total_space_freed_mb": 245.5,
    "success": true
  }
}
```

#### GET /api/v1/admin/cleanup/stats
Get comprehensive system statistics.

**Response**:
```json
{
  "database": {
    "total_size_mb": 5120,
    "table_sizes": {...}
  },
  "activity_logs": {
    "total_count": 50000,
    "oldest_date": "2024-01-01T00:00:00Z"
  },
  "temp_files": {
    "total_count": 250,
    "total_size_mb": 500
  },
  ...
}
```

#### GET /api/v1/admin/cleanup/estimate
Estimate cleanup impact.

**Query Parameters**:
- `activity_log_days` (int)
- `execution_log_days` (int)

**Response**:
```json
{
  "estimated_records_to_delete": 1500,
  "estimated_space_to_free_mb": 200,
  "breakdown": {...}
}
```

### Production Safeguard Endpoints

#### GET /api/v1/admin/settings/dev-role-production
Get developer role production setting status.

**Authorization**: Admin only

**Response**:
```json
{
  "allowed": false,
  "is_production": true,
  "setting_exists": true,
  "expires_at": null
}
```

#### PUT /api/v1/admin/settings/dev-role-production
Enable/disable developer role in production.

**Authorization**: Admin only

**Request Body**:
```json
{
  "allow": true,
  "hours": 24
}
```

**Response**:
```json
{
  "message": "Developer role enabled in production",
  "allowed": true,
  "expires_at": "2025-10-13T10:00:00Z",
  "hours_until_expiration": 24,
  "warning": "This setting will automatically expire..."
}
```

---

## Updated Endpoint Protection

### Pipeline Endpoints

| Endpoint | Method | Required Role | Notes |
|----------|--------|---------------|-------|
| `/api/v1/pipelines/` | GET | Viewer+ | All users can view |
| `/api/v1/pipelines/` | POST | Designer+ | Create pipeline |
| `/api/v1/pipelines/{id}` | GET | Viewer+ | View specific pipeline |
| `/api/v1/pipelines/{id}` | PUT | Designer+ | Update pipeline |
| `/api/v1/pipelines/{id}` | DELETE | Designer+ | Delete pipeline |

### Execution Endpoints

| Endpoint | Method | Required Role | Notes |
|----------|--------|---------------|-------|
| `/api/v1/pipeline-execution/{id}/execute` | POST | Executor+ | Execute pipeline |
| `/api/v1/pipeline-execution/runs/{id}/cancel` | POST | Executor+ | Cancel execution |
| `/api/v1/pipeline-execution/{id}/runs` | GET | Viewer+ | View execution history |

### Analytics Endpoints

| Endpoint | Method | Required Role | Notes |
|----------|--------|---------------|-------|
| `/api/v1/analytics/data` | GET | Executive+ | View analytics |
| `/api/v1/analytics/timeseries` | GET | Executive+ | Time series data |
| `/api/v1/analytics/export-data` | GET | Executive+ | Export reports |
| `/api/v1/analytics/aggregated` | GET | Executive+ | Aggregated analytics |

### Monitoring & Dashboard

| Endpoint | Method | Required Role | Notes |
|----------|--------|---------------|-------|
| `/api/v1/dashboard/stats` | GET | Viewer+ | Dashboard statistics |
| `/api/v1/monitoring/pipeline-stats` | GET | Viewer+ | Pipeline monitoring |
| `/api/v1/monitoring/system-health` | GET | Viewer+ | System health |

---

## Authentication & Authorization

### JWT Token Requirements

All API requests (except auth endpoints) require a valid JWT token:

```http
Authorization: Bearer <jwt_token>
```

### Token Payload

JWT tokens contain:
```json
{
  "sub": "user_id",
  "username": "john_doe",
  "role": "designer",
  "is_superuser": false,
  "exp": 1697123456
}
```

### Role Verification Flow

1. Request received with JWT token
2. Token validated and decoded
3. User role extracted from token
4. Endpoint's required role checked
5. Access granted or denied (403)

---

## Error Codes

### New Phase 8 Error Responses

#### 403 Forbidden - Insufficient Role

**Scenario**: User's role insufficient for endpoint

```json
{
  "detail": "Insufficient permissions. Required roles: ['designer', 'developer', 'admin']"
}
```

#### 403 Forbidden - Admin User Protection

**Scenario**: Developer trying to modify admin user

```json
{
  "detail": "Developer role cannot modify the admin user account. Only administrators can modify the admin user."
}
```

#### 403 Forbidden - Developer Role in Production

**Scenario**: Developer role blocked in production

```json
{
  "detail": "Developer role is not allowed in production environment. Administrator must enable ALLOW_DEV_ROLE_IN_PRODUCTION flag."
}
```

#### 403 Forbidden - Role Assignment

**Scenario**: Insufficient permission to assign role

```json
{
  "detail": "Developer role cannot assign Admin or Developer roles. Only administrators can assign these sensitive roles."
}
```

---

## Migration Notes

### Breaking Changes

1. **Default Role Changed**: New users now default to Viewer (previously Editor)
2. **Analytics Endpoints**: Now require Executive role (previously any authenticated user)
3. **Cleanup Endpoints**: Now require Developer+ role (previously Admin only)
4. **Role Assignment**: Developer can no longer assign Admin/Developer roles

### Backward Compatibility

- Existing users retain their roles
- `require_editor_or_admin()` dependency aliased to `require_designer()`
- `require_any_authenticated()` still works but prefer `require_viewer()`

---

## Best Practices

### Role Assignment Guidelines

1. **Default to Viewer**: Start users with minimum access
2. **Principle of Least Privilege**: Grant only necessary permissions
3. **Regular Audits**: Review role assignments quarterly
4. **Developer Role**: Use only in non-production environments
5. **Admin Protection**: Never modify default admin account programmatically

### Production Deployment

1. **Disable Dev User**: Set `CREATE_DEV_USER=false` in production
2. **Monitor Dev Role**: Alert when developer role active in production
3. **Regular Cleanup**: Schedule cleanup operations during low traffic
4. **Backup Before Cleanup**: Always backup before major cleanup operations

---

## Support & Resources

- **PRD**: See `docs/prd.md` for full Phase 8 requirements
- **Security Guide**: See `docs/PHASE8_SECURITY_GUIDE.md`
- **Deployment Guide**: See `docs/PHASE8_DEPLOYMENT_GUIDE.md`
- **Runbook**: See `docs/PHASE8_RUNBOOK.md`

---

**Last Updated**: October 12, 2025
**Phase 8 Status**: Backend Complete, Frontend Pending
