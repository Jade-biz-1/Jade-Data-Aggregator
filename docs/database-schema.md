# Database Schema Documentation

**Data Aggregator Platform - PostgreSQL Schema**

**Version**: 1.0
**Last Updated**: October 3, 2025
**Database**: PostgreSQL 14+

---

## Overview

The Data Aggregator Platform uses PostgreSQL as its primary database with the following design principles:

- **Async SQLAlchemy ORM** for database operations
- **Table partitioning** for time-series data (logs, metrics)
- **Proper indexing** for query optimization
- **Foreign key constraints** for data integrity
- **Soft deletes** where applicable (is_active flags)
- **Timestamps** on all tables (created_at, updated_at)

### Database Connection

- **Connection Pooling**: 20 connections (max overflow: 40)
- **Connection Recycling**: 1 hour
- **Pre-ping**: Enabled for connection validation

---

## Core Tables

### users

Stores user accounts and authentication information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-incrementing user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| hashed_password | VARCHAR | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(255) | NULL | User's full name |
| role | VARCHAR(50) | NOT NULL | User role (admin, editor, viewer) |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| created_at | TIMESTAMP | NOT NULL | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_is_active` on `is_active`

**Relationships**:
- `pipelines` (one-to-many)
- `connectors` (one-to-many)
- `transformations` (one-to-many)
- `file_uploads` (one-to-many)
- `user_preferences` (one-to-one)

---

### pipelines

Stores data pipeline definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Pipeline ID |
| name | VARCHAR(255) | NOT NULL | Pipeline name |
| description | TEXT | NULL | Pipeline description |
| source_config | JSONB | NOT NULL | Source configuration |
| transformation_config | JSONB | NULL | Transformation rules |
| destination_config | JSONB | NOT NULL | Destination configuration |
| schedule | VARCHAR(100) | NULL | Cron schedule |
| is_active | BOOLEAN | DEFAULT TRUE | Pipeline status |
| visual_definition | JSONB | NULL | React Flow definition |
| owner_id | INTEGER | FK(users.id) | Pipeline owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_pipelines_owner_id` on `owner_id`
- `idx_pipelines_is_active` on `is_active`
- `idx_pipelines_name` on `name`

**Relationships**:
- `owner` (many-to-one with users)
- `runs` (one-to-many with pipeline_runs)
- `versions` (one-to-many with pipeline_versions)
- `file_uploads` (one-to-many)

---

### pipeline_runs

Stores pipeline execution history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Run ID |
| pipeline_id | INTEGER | FK(pipelines.id) | Associated pipeline |
| status | VARCHAR(50) | NOT NULL | pending, running, completed, failed |
| started_at | TIMESTAMP | NULL | Execution start time |
| completed_at | TIMESTAMP | NULL | Execution completion time |
| records_processed | INTEGER | DEFAULT 0 | Number of records processed |
| error_message | TEXT | NULL | Error details if failed |
| execution_log | JSONB | NULL | Detailed execution log |
| created_at | TIMESTAMP | NOT NULL | Record creation |

**Indexes**:
- `idx_pipeline_runs_pipeline_id` on `pipeline_id`
- `idx_pipeline_runs_status` on `status`
- `idx_pipeline_runs_started_at` on `started_at`

**Partitioning**: Planned for table partitioning by created_at (monthly)

---

### connectors

Stores data source and destination connector configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Connector ID |
| name | VARCHAR(255) | NOT NULL | Connector name |
| connector_type | VARCHAR(100) | NOT NULL | Type (postgresql, mysql, rest_api, etc.) |
| config | JSONB | NOT NULL | Connection configuration |
| is_active | BOOLEAN | DEFAULT TRUE | Connector status |
| owner_id | INTEGER | FK(users.id) | Connector owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_connectors_owner_id` on `owner_id`
- `idx_connectors_type` on `connector_type`
- `idx_connectors_is_active` on `is_active`

**Relationships**:
- `owner` (many-to-one with users)

---

### transformations

Stores data transformation definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Transformation ID |
| name | VARCHAR(255) | NOT NULL | Transformation name |
| transformation_type | VARCHAR(100) | NOT NULL | Type (filter, map, aggregate, etc.) |
| transformation_code | TEXT | NULL | Python/SQL transformation code |
| config | JSONB | NULL | Transformation configuration |
| is_active | BOOLEAN | DEFAULT TRUE | Status |
| owner_id | INTEGER | FK(users.id) | Owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_transformations_owner_id` on `owner_id`
- `idx_transformations_type` on `transformation_type`

---

## Advanced Feature Tables

### pipeline_templates

Stores reusable pipeline templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Template ID |
| name | VARCHAR(255) | NOT NULL | Template name |
| description | TEXT | NULL | Template description |
| category | VARCHAR(100) | NOT NULL | etl, elt, quality, streaming |
| template_config | JSONB | NOT NULL | Pipeline configuration template |
| is_builtin | BOOLEAN | DEFAULT FALSE | Built-in template flag |
| is_public | BOOLEAN | DEFAULT FALSE | Public visibility |
| use_count | INTEGER | DEFAULT 0 | Usage counter |
| tags | ARRAY(VARCHAR) | NULL | Template tags |
| owner_id | INTEGER | FK(users.id) | Template owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_pipeline_templates_category` on `category`
- `idx_pipeline_templates_is_builtin` on `is_builtin`
- `idx_pipeline_templates_use_count` on `use_count`

---

### pipeline_versions

Stores pipeline version history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Version ID |
| pipeline_id | INTEGER | FK(pipelines.id) | Associated pipeline |
| version_number | INTEGER | NOT NULL | Sequential version number |
| version_name | VARCHAR(255) | NULL | Version name |
| change_description | TEXT | NULL | Change description |
| snapshot | JSONB | NOT NULL | Complete pipeline state |
| is_active | BOOLEAN | DEFAULT FALSE | Active version flag |
| created_by | INTEGER | FK(users.id) | Creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Indexes**:
- `idx_pipeline_versions_pipeline_id` on `pipeline_id`
- `idx_pipeline_versions_is_active` on `is_active`
- `idx_pipeline_versions_version_number` on `version_number`

**Unique Constraint**: `(pipeline_id, version_number)` - ensures unique version numbers per pipeline

---

### transformation_functions

Stores reusable transformation function library.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Function ID |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Function name (code identifier) |
| display_name | VARCHAR(255) | NOT NULL | Display name |
| description | TEXT | NULL | Function description |
| category | VARCHAR(100) | NOT NULL | filter, map, aggregate, sort, custom |
| function_type | VARCHAR(50) | NOT NULL | python, sql |
| function_code | TEXT | NOT NULL | Function implementation |
| parameters | JSONB | NULL | Function parameters schema |
| example_usage | TEXT | NULL | Usage example |
| is_builtin | BOOLEAN | DEFAULT FALSE | Built-in function flag |
| is_public | BOOLEAN | DEFAULT FALSE | Public visibility |
| use_count | INTEGER | DEFAULT 0 | Usage counter |
| tags | ARRAY(VARCHAR) | NULL | Function tags |
| owner_id | INTEGER | FK(users.id) | Function owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_transformation_functions_name` on `name`
- `idx_transformation_functions_category` on `category`
- `idx_transformation_functions_is_builtin` on `is_builtin`

---

### schema_mappings

Stores field mappings between source and destination schemas.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Mapping ID |
| name | VARCHAR(255) | NOT NULL | Mapping name |
| source_schema | JSONB | NOT NULL | Source schema definition |
| destination_schema | JSONB | NOT NULL | Destination schema definition |
| field_mappings | JSONB | NOT NULL | Field-to-field mappings |
| transformation_rules | JSONB | NULL | Transformation rules |
| is_active | BOOLEAN | DEFAULT TRUE | Status |
| owner_id | INTEGER | FK(users.id) | Owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_schema_mappings_owner_id` on `owner_id`

---

## File Processing Tables

### file_uploads

Stores uploaded file metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | File ID |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | Storage path |
| file_type | VARCHAR(50) | NOT NULL | csv, json, xml, excel, etc. |
| file_size | BIGINT | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NULL | MIME type |
| file_hash | VARCHAR(64) | NULL | SHA-256 hash |
| status | VARCHAR(50) | NOT NULL | uploading, uploaded, processing, completed, failed |
| upload_progress | INTEGER | DEFAULT 0 | Upload progress (0-100) |
| total_chunks | INTEGER | DEFAULT 1 | Total chunks |
| uploaded_chunks | INTEGER | DEFAULT 0 | Uploaded chunks |
| metadata | JSONB | NULL | File metadata |
| is_temporary | BOOLEAN | DEFAULT TRUE | Temporary file flag |
| expires_at | TIMESTAMP | NULL | Expiration timestamp |
| owner_id | INTEGER | FK(users.id) | File owner |
| pipeline_id | INTEGER | FK(pipelines.id) | Associated pipeline |
| created_at | TIMESTAMP | NOT NULL | Upload timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_file_uploads_owner_id` on `owner_id`
- `idx_file_uploads_pipeline_id` on `pipeline_id`
- `idx_file_uploads_file_hash` on `file_hash`
- `idx_file_uploads_expires_at` on `expires_at`
- `idx_file_uploads_status` on `status`

---

### file_processing_jobs

Stores background file processing job status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Job ID |
| file_id | INTEGER | FK(file_uploads.id) | Associated file |
| job_type | VARCHAR(100) | NOT NULL | validation, conversion, extraction |
| status | VARCHAR(50) | NOT NULL | pending, running, completed, failed |
| progress | INTEGER | DEFAULT 0 | Progress (0-100) |
| result_data | JSONB | NULL | Job result data |
| error_message | TEXT | NULL | Error details |
| output_file_id | INTEGER | FK(file_uploads.id) | Output file if applicable |
| created_at | TIMESTAMP | NOT NULL | Job creation |
| completed_at | TIMESTAMP | NULL | Job completion |

**Indexes**:
- `idx_file_processing_jobs_file_id` on `file_id`
- `idx_file_processing_jobs_status` on `status`

---

## Monitoring & Logging Tables

### system_logs

Stores structured application logs (partitioned by date).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY | Log ID |
| level | VARCHAR(20) | NOT NULL | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| message | TEXT | NOT NULL | Log message |
| logger_name | VARCHAR(255) | NULL | Logger name |
| module | VARCHAR(255) | NULL | Module name |
| function_name | VARCHAR(255) | NULL | Function name |
| line_number | INTEGER | NULL | Line number |
| correlation_id | VARCHAR(100) | NULL | Request correlation ID |
| user_id | INTEGER | FK(users.id) | Associated user |
| request_id | VARCHAR(100) | NULL | Request ID |
| request_method | VARCHAR(10) | NULL | HTTP method |
| request_path | VARCHAR(500) | NULL | Request path |
| request_ip | VARCHAR(45) | NULL | Client IP |
| duration_ms | INTEGER | NULL | Request duration |
| memory_usage_mb | FLOAT | NULL | Memory usage |
| exception_type | VARCHAR(255) | NULL | Exception type |
| exception_message | TEXT | NULL | Exception message |
| stack_trace | TEXT | NULL | Stack trace |
| extra_data | JSONB | NULL | Additional context |
| created_at | TIMESTAMP | NOT NULL | Log timestamp |

**Indexes**:
- `idx_system_logs_level` on `level`
- `idx_system_logs_correlation_id` on `correlation_id`
- `idx_system_logs_created_at` on `created_at`
- `idx_system_logs_user_id` on `user_id`

**Partitioning**: Table partitioned by `created_at` (monthly partitions)

---

### alert_rules

Stores configurable alert rules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Rule ID |
| name | VARCHAR(255) | NOT NULL | Rule name |
| description | TEXT | NULL | Rule description |
| metric | VARCHAR(100) | NOT NULL | Metric to monitor |
| threshold | FLOAT | NOT NULL | Alert threshold |
| operator | VARCHAR(20) | NOT NULL | gt, gte, lt, lte, eq |
| severity | VARCHAR(20) | NOT NULL | low, medium, high, critical |
| is_active | BOOLEAN | DEFAULT TRUE | Rule status |
| cooldown_minutes | INTEGER | DEFAULT 60 | Alert cooldown |
| notification_channels | ARRAY(VARCHAR) | NULL | email, slack, webhook |
| escalation_policy_id | INTEGER | FK(alert_escalation_policies.id) | Escalation policy |
| owner_id | INTEGER | FK(users.id) | Rule owner |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_alert_rules_is_active` on `is_active`
- `idx_alert_rules_metric` on `metric`

---

### alerts

Stores triggered alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Alert ID |
| rule_id | INTEGER | FK(alert_rules.id) | Alert rule |
| severity | VARCHAR(20) | NOT NULL | Alert severity |
| status | VARCHAR(20) | NOT NULL | active, acknowledged, resolved, closed |
| metric_value | FLOAT | NOT NULL | Value that triggered alert |
| message | TEXT | NOT NULL | Alert message |
| context | JSONB | NULL | Alert context |
| acknowledged_by | INTEGER | FK(users.id) | Acknowledging user |
| acknowledged_at | TIMESTAMP | NULL | Acknowledgment time |
| resolved_by | INTEGER | FK(users.id) | Resolving user |
| resolved_at | TIMESTAMP | NULL | Resolution time |
| resolution_type | VARCHAR(20) | NULL | manual, auto |
| escalation_level | INTEGER | DEFAULT 0 | Current escalation level |
| last_escalated_at | TIMESTAMP | NULL | Last escalation time |
| notifications_sent | JSONB | NULL | Sent notifications log |
| created_at | TIMESTAMP | NOT NULL | Alert creation |
| updated_at | TIMESTAMP | NOT NULL | Last update |

**Indexes**:
- `idx_alerts_rule_id` on `rule_id`
- `idx_alerts_status` on `status`
- `idx_alerts_severity` on `severity`
- `idx_alerts_created_at` on `created_at`

**Partitioning**: Table partitioned by `created_at` (monthly partitions)

---

## User Preference Tables

### user_preferences

Stores user preference settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Preference ID |
| user_id | INTEGER | FK(users.id), UNIQUE | Associated user |
| theme | VARCHAR(20) | DEFAULT 'light' | UI theme (light, dark) |
| language | VARCHAR(10) | DEFAULT 'en' | Language code |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | User timezone |
| date_format | VARCHAR(20) | DEFAULT 'YYYY-MM-DD' | Date format preference |
| time_format | VARCHAR(20) | DEFAULT '24h' | Time format (12h, 24h) |
| notifications_enabled | BOOLEAN | DEFAULT TRUE | Notifications enabled |
| email_notifications | BOOLEAN | DEFAULT TRUE | Email notifications |
| dashboard_refresh_interval | INTEGER | DEFAULT 30 | Dashboard refresh (seconds) |
| accessibility_mode | BOOLEAN | DEFAULT FALSE | Accessibility features |
| custom_settings | JSONB | NULL | Additional custom settings |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_user_preferences_user_id` on `user_id`

---

### dashboard_layouts

Stores customizable dashboard layouts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Layout ID |
| user_id | INTEGER | FK(users.id) | Layout owner |
| name | VARCHAR(255) | NOT NULL | Layout name |
| description | TEXT | NULL | Layout description |
| layout_config | JSONB | NOT NULL | Widget positions & settings |
| is_default | BOOLEAN | DEFAULT FALSE | Default layout flag |
| is_shared | BOOLEAN | DEFAULT FALSE | Shared with team |
| version | INTEGER | DEFAULT 1 | Layout version |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_dashboard_layouts_user_id` on `user_id`
- `idx_dashboard_layouts_is_default` on `is_default`

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │─────┐
└─────────────┘     │
       │            │
       │ owner_id   │
       ▼            │
┌─────────────┐     │
│  pipelines  │◄────┤
└─────────────┘     │
       │            │
       │            │
       ▼            │
┌──────────────────┐│
│  pipeline_runs   ││
└──────────────────┘│
                    │
┌─────────────┐     │
│ connectors  │◄────┤
└─────────────┘     │
                    │
┌─────────────────┐ │
│transformations  │◄┤
└─────────────────┘ │
                    │
┌──────────────────┐│
│ file_uploads     │◄┤
└──────────────────┘│
                    │
┌──────────────────┐│
│ system_logs      │◄┘
└──────────────────┘
```

---

## Database Migrations

Migrations are managed using **Alembic**.

### Creating a Migration

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Run migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Migration Files Location

`backend/alembic/versions/`

---

## Performance Optimization

### Indexing Strategy

1. **Primary Keys**: Auto-indexed
2. **Foreign Keys**: Indexed for JOIN performance
3. **Frequently Queried Columns**: Indexed (status, is_active, created_at)
4. **Composite Indexes**: For complex queries (e.g., `(pipeline_id, status)`)

### Table Partitioning

Tables with high write volume are partitioned:

- `system_logs`: Partitioned by `created_at` (monthly)
- `alerts`: Partitioned by `created_at` (monthly)
- `pipeline_runs`: Planned partitioning by `created_at`

### Query Optimization

- Connection pooling (20 connections, max overflow 40)
- Prepared statements via SQLAlchemy
- Query result caching via Redis
- Async queries for non-blocking I/O

---

## Backup & Recovery

### Backup Strategy

- **Daily full backups** at 2:00 AM UTC
- **Hourly incremental backups** during business hours
- **Transaction log backups** every 15 minutes
- **Retention**: 30 days for daily backups, 7 days for incrementals

### Point-in-Time Recovery

PostgreSQL WAL (Write-Ahead Logging) enables point-in-time recovery with RPO of 15 minutes.

### Restore Procedure

```bash
# Stop application
docker-compose down

# Restore from backup
pg_restore -U postgres -d dataaggregator backup_file.dump

# Restart application
docker-compose up -d
```

---

## Database Maintenance

### Regular Maintenance Tasks

1. **VACUUM**: Weekly (automated)
2. **ANALYZE**: Daily (automated)
3. **REINDEX**: Monthly
4. **Partition Management**: Automated creation/archival

### Monitoring Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('dataaggregator'));

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';
```

---

## Security Considerations

1. **Password Hashing**: Bcrypt with cost factor 12
2. **Connection Encryption**: SSL/TLS for database connections
3. **Row-Level Security**: Planned for multi-tenancy
4. **Audit Logging**: All schema changes logged
5. **Sensitive Data**: Encrypted at rest using PostgreSQL extensions

---

**For schema changes or questions, please contact the database administrator or refer to the SQLAlchemy models in `backend/models/`.**
