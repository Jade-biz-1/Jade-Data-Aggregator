# UI Access Guide - Pipelines, Transformations & Connectors
**Data Aggregator Platform**

## Document Information
- **Date**: November 4, 2025
- **Target Audience**: Developers, Designers, Administrators
- **Purpose**: Guide to accessing and using configuration UIs

---

## Overview

The Data Aggregator Platform provides comprehensive UIs for configuring:
1. **Pipelines** - Data flow orchestration
2. **Transformations** - Data processing rules
3. **Connectors** - Data source/destination connections

All UIs are **permission-based** and accessible through the main navigation sidebar.

---

## 1. Pipeline Configuration UI

### 1.1 Access Points

#### **A. Pipelines List Page** (`/pipelines`)
**Access**: Click "Pipelines" in the sidebar navigation

**Available to Roles**:
- ✅ Admin (Full access)
- ✅ Developer (Full access)
- ✅ Designer (Full access)
- ✅ Executor (View + Execute)
- ✅ Viewer (View only)
- ✅ Executive (View only)

**Features**:
- View all pipelines in a table format
- Search and filter pipelines
- See pipeline status (Active/Paused)
- View source and destination types
- Execute pipelines (with permission)
- Delete pipelines (with permission)
- Click on pipeline row to edit

**Actions Available**:
```
View      - All roles
Execute   - Admin, Developer, Designer, Executor
Edit      - Admin, Developer, Designer
Delete    - Admin, Developer, Designer
Create    - Click "New Pipeline" button (top right)
```

#### **B. Visual Pipeline Builder** (`/pipeline-builder`)
**Access**:
- Click "New Pipeline" button on `/pipelines` page
- Or navigate directly to `/pipeline-builder`
- Or click on a visual pipeline in the list

**Available to Roles**:
- ✅ Admin (Full access)
- ✅ Developer (Full access)
- ✅ Designer (Full access)
- ❌ Executor (No create/edit access)
- ❌ Viewer (No access)
- ❌ Executive (No access)

**Features**:
- **Drag-and-Drop Interface**: Visual canvas powered by React Flow
- **Node Palette**: Left sidebar with available node types:
  - **Data Sources**: Database, API, File, S3, etc.
  - **Transformations**: Filter, Map, Aggregate, Join, etc.
  - **Destinations**: Database, API, File, S3, etc.
- **Connection Lines**: Draw connections between nodes
- **Node Configuration**: Click nodes to configure properties
- **Save/Load**: Save pipelines and load for editing
- **Templates**: Pre-built pipeline templates
- **Dry Run**: Test pipeline without executing
- **Execution Panel**: Execute and monitor pipeline

### 1.2 How to Create a Pipeline (Visual Builder)

#### **Step-by-Step Guide**:

1. **Navigate to Pipeline Builder**
   ```
   Sidebar → Pipelines → Click "New Pipeline" button
   ```

2. **Add Source Node**
   - From left palette, drag a "Data Source" node to canvas
   - Click the node to configure:
     - Select source type (Database, API, File, etc.)
     - Configure connection details
     - Set query/path parameters

3. **Add Transformation Nodes** (Optional)
   - Drag transformation nodes from palette
   - Connect source → transformation
   - Configure each transformation:
     - Filter rules
     - Mapping rules
     - Aggregation settings

4. **Add Destination Node**
   - Drag a "Destination" node to canvas
   - Connect from source/transformation → destination
   - Configure:
     - Destination type
     - Connection details
     - Write settings

5. **Configure Pipeline Settings**
   - Click pipeline name at top to edit
   - Add description
   - Set schedule (optional)

6. **Save Pipeline**
   - Click "Save" button (top right)
   - Pipeline is now created and ready to execute

7. **Test Pipeline** (Optional)
   - Click "Dry Run" to test without real execution
   - Review test results
   - Make adjustments if needed

8. **Execute Pipeline**
   - Click "Execute" button
   - Monitor in execution panel
   - View logs in real-time

### 1.3 How to Edit an Existing Pipeline

#### **Method 1: From Pipelines List**
```
1. Go to /pipelines
2. Click on any pipeline row
3. Pipeline builder opens in edit mode
4. Make changes
5. Click "Save"
```

#### **Method 2: Direct URL**
```
Navigate to: /pipeline-builder?id=PIPELINE_ID
```

### 1.4 Pipeline Types

The platform supports two types of pipelines:

#### **Visual Pipelines** (`pipeline_type: 'visual'`)
- Created with visual builder
- Stored as node graph in database
- Drag-and-drop configuration
- Best for: Complex multi-step workflows

#### **Traditional Pipelines** (`pipeline_type: 'traditional'`)
- Created via API or legacy UI
- Configuration-based (JSON)
- Code/config driven
- Best for: Simple point-to-point transfers

---

## 2. Transformation Configuration UI

### 2.1 Access Points

#### **Transformations Page** (`/transformations`)
**Access**: Click "Transformations" in the sidebar navigation

**Available to Roles**:
- ✅ Admin (Full access)
- ✅ Developer (Full access)
- ✅ Designer (Full access)
- ✅ Executor (View + Execute)
- ✅ Viewer (View only)
- ✅ Executive (View only)

**Features**:
- View all transformations in card grid
- Search transformations by name/type
- See transformation types:
  - **Filter**: Filter records based on conditions
  - **Map**: Transform field values
  - **Aggregate**: Group and aggregate data
  - **Join**: Join multiple datasets
  - **Enrich**: Add data from external sources
  - **Validate**: Data quality checks
  - **Custom**: User-defined transformations
- Test transformations
- Edit transformations
- Delete transformations

### 2.2 Current UI Status

**Note**: The transformations page currently shows a **list view** with these actions:
- ✅ View all transformations
- ✅ Search/filter
- ✅ Test transformation
- ✅ Delete transformation
- ⏳ Edit functionality - Shows "Coming Soon" message

### 2.3 Creating Transformations

Currently, transformations are created in two ways:

#### **A. Within Pipeline Builder**
```
1. Open pipeline builder
2. Drag transformation node to canvas
3. Click node to configure
4. Transformation is saved as part of pipeline
```

#### **B. Via Transformation Function Library** (Phase 2 - Coming Soon)
```
Dedicated page for browsing and creating reusable transformations
Location: /transformations/functions (to be implemented)
```

### 2.4 Transformation Types Explained

| Type | Description | Use Case |
|------|-------------|----------|
| **Filter** | Remove records that don't match conditions | Filter out inactive users |
| **Map** | Transform field values | Convert temperature C→F |
| **Aggregate** | Group and calculate | Sum sales by region |
| **Join** | Combine multiple datasets | Join users with orders |
| **Enrich** | Add data from external source | Add geolocation data |
| **Validate** | Check data quality | Validate email format |
| **Custom** | User-defined logic (Python/SQL) | Complex business rules |

---

## 3. Connector Configuration UI

### 3.1 Access Points

#### **Connectors Page** (`/connectors`)
**Access**: Click "Connectors" in the sidebar navigation

**Available to Roles**:
- ✅ Admin (Full access)
- ✅ Developer (Full access)
- ✅ Designer (Full access)
- ✅ Executor (View + Test)
- ✅ Viewer (View only)
- ✅ Executive (View only)

**Features**:
- View all connectors in grid
- Search connectors
- Filter by type:
  - Database (PostgreSQL, MySQL, MongoDB, etc.)
  - API (REST, GraphQL)
  - File (CSV, JSON, XML, Excel)
  - Cloud Storage (S3, GCS, Azure Blob)
  - SaaS (Salesforce, HubSpot, etc.)
- Test connections
- View connection status
- Edit connectors
- Delete connectors

### 3.2 Connector Configure Page (`/connectors/configure`)

**Access**: Click "New Connector" or "Configure" button on connectors page

**Features**:
- **Dynamic Form Generation**: Forms adapt based on connector type
- **Connection Testing**: Test before saving
- **Validation**: Real-time validation of settings
- **Configuration Recommendations**: Best practice suggestions

### 3.3 How to Create a Connector

#### **Step-by-Step Guide**:

1. **Navigate to Connectors**
   ```
   Sidebar → Connectors
   ```

2. **Click "New Connector"**
   ```
   Button in top-right corner
   ```

3. **Select Connector Type**
   ```
   Choose from:
   - Database (PostgreSQL, MySQL, MongoDB, etc.)
   - API (REST, GraphQL)
   - File System (Local, FTP, SFTP)
   - Cloud Storage (S3, GCS, Azure)
   - SaaS Platform (Salesforce, HubSpot, etc.)
   ```

4. **Configure Connection**
   - **Name**: Give connector a descriptive name
   - **Description**: Optional description
   - **Connection Details** (varies by type):
     - **Database**: Host, port, database name, credentials
     - **API**: Endpoint URL, authentication (API key, OAuth)
     - **File**: Path, protocol, credentials
     - **Cloud**: Region, bucket/container, credentials
     - **SaaS**: OAuth flow or API key

5. **Test Connection**
   ```
   Click "Test Connection" button
   Wait for validation
   Green checkmark = Success
   Red X = Failed (check settings)
   ```

6. **Save Connector**
   ```
   Click "Save" button
   Connector is now available for use in pipelines
   ```

### 3.4 Connector Status Indicators

| Status | Icon | Meaning |
|--------|------|---------|
| **Connected** | 🟢 Green checkmark | Active and working |
| **Disconnected** | 🔴 Red X | Not active or failed |
| **Testing** | 🟡 Clock | Connection test in progress |
| **Error** | ⚠️ Alert | Configuration error |

---

## 4. Developer User Access Summary

### 4.1 What Can a Developer User Access?

As a **Developer** user, you have **nearly full admin-level access** with the following capabilities:

#### **Pipelines** ✅
- ✅ View all pipelines
- ✅ Create new pipelines
- ✅ Edit existing pipelines
- ✅ Delete pipelines
- ✅ Execute pipelines
- ✅ View execution history
- ✅ View execution logs
- ✅ Retry failed executions
- ✅ Cancel running executions

#### **Transformations** ✅
- ✅ View all transformations
- ✅ Create transformations (in pipeline builder)
- ✅ Test transformations
- ✅ Delete transformations
- ⏳ Edit transformations (coming soon)

#### **Connectors** ✅
- ✅ View all connectors
- ✅ Create new connectors
- ✅ Edit existing connectors
- ✅ Test connections
- ✅ Delete connectors

#### **Monitoring & Alerts** ✅
- ✅ View real-time monitoring
- ✅ Create alert rules
- ✅ Manage alert rules
- ✅ Acknowledge alerts
- ✅ View alert history

#### **Analytics** ✅
- ✅ View advanced analytics
- ✅ Generate reports
- ✅ Export data

#### **Users** ✅
- ✅ View all users (except admin details in some cases)
- ✅ Create new users
- ✅ Edit users (except admin user modifications)
- ✅ Assign roles (except cannot modify admin user)
- ✅ Activate/deactivate users (except admin)

#### **System Maintenance** ✅
- ✅ Access maintenance panel
- ✅ Run cleanup operations
- ✅ View activity logs
- ✅ System health monitoring

### 4.2 Developer User Restrictions

Developer users **cannot**:
- ❌ Modify the admin user (role, password, status)
- ❌ Delete the admin user
- ❌ Reset admin user password
- ❌ Change their own role to admin

### 4.3 Developer User Login

#### **Default Developer Account** (Development Environment):
```
Username: dev
Password: dev12345
```

**Note**:
- This account is created only when `CREATE_DEV_USER=true` environment variable is set
- Initially created as **INACTIVE** (must be activated by admin)
- Admin must manually activate in Users page
- Should be deactivated or removed in production

---

## 5. Navigation Quick Reference

### 5.1 Sidebar Navigation

```
┌─────────────────────────────────┐
│  DataAggregator                 │
│  [Developer]                    │ ← Role badge
├─────────────────────────────────┤
│  🏠 Dashboard                   │
│  🔀 Pipelines                   │ ← Pipeline list
│  🔌 Connectors                  │ ← Connector list
│  🔧 Transformations             │ ← Transformation list
│  📊 Analytics                   │
│  📡 Monitoring                  │
│  🔔 Alerts                      │ ← Alert management
│  👥 Users                       │
│  🔧 Maintenance                 │
├─────────────────────────────────┤
│  📄 Documentation               │
│  ⚙️  Settings                   │
│  ❓ Help                        │
└─────────────────────────────────┘
```

### 5.2 URL Reference

| Feature | URL | Purpose |
|---------|-----|---------|
| **Pipelines List** | `/pipelines` | View all pipelines |
| **Pipeline Builder** | `/pipeline-builder` | Create new visual pipeline |
| **Edit Pipeline** | `/pipeline-builder?id=123` | Edit existing pipeline |
| **Execution History** | `/pipelines/123/executions` | View pipeline runs |
| **Execution Details** | `/pipelines/123/executions/456` | Detailed run logs |
| **Connectors List** | `/connectors` | View all connectors |
| **Configure Connector** | `/connectors/configure` | Create/edit connector |
| **Transformations List** | `/transformations` | View all transformations |
| **Alerts Dashboard** | `/alerts` | View active alerts |
| **Alert Rules** | `/alerts/rules` | Manage alert rules |
| **Alert History** | `/alerts/history` | Historical alerts |
| **Advanced Analytics** | `/analytics/advanced` | Analytics & reports |
| **Live Monitoring** | `/monitoring/live` | Real-time monitoring |
| **Users Management** | `/users` | Manage users |
| **System Maintenance** | `/admin/maintenance` | Cleanup & maintenance |

---

## 6. Common Workflows

### 6.1 Workflow: Create and Execute a Simple Pipeline

```
Step 1: Create Connector (if not exists)
   Sidebar → Connectors → New Connector
   → Select type → Configure → Test → Save

Step 2: Create Pipeline
   Sidebar → Pipelines → New Pipeline
   → Opens Pipeline Builder

Step 3: Build Pipeline
   → Drag source node → Configure with connector
   → Drag destination node → Configure
   → Connect source → destination
   → Add name and description

Step 4: Save Pipeline
   → Click "Save" button

Step 5: Execute Pipeline
   → Click "Execute" button
   → View in execution panel

Step 6: Monitor Execution
   → View logs in real-time
   → Check for errors
   → View in execution history
```

### 6.2 Workflow: Debug a Failed Pipeline

```
Step 1: View Execution History
   Sidebar → Pipelines → Click pipeline → Executions tab
   OR Navigate to: /pipelines/{id}/executions

Step 2: Find Failed Run
   → Look for red "Failed" status
   → Click "Details" button

Step 3: View Execution Details
   → See error message prominently displayed
   → Check execution steps for failure point
   → View logs with search/filter

Step 4: Identify Issue
   → Search logs for ERROR or CRITICAL
   → Check specific step that failed
   → Review error details

Step 5: Fix Pipeline
   → Go back to pipeline builder
   → Edit configuration
   → Save changes

Step 6: Retry Execution
   → Click "Retry" button on failed run
   → Monitor new execution
```

### 6.3 Workflow: Set Up Alerts for Pipeline Failures

```
Step 1: Navigate to Alerts
   Sidebar → Alerts

Step 2: Open Alert Rules
   → Click "Manage Rules" button

Step 3: Create New Rule
   → Click "New Rule" button

Step 4: Configure Alert
   Metric: Pipeline Failure Rate
   Operator: Greater Than
   Threshold: 50 (%)
   Duration: 5 minutes
   Severity: Critical

Step 5: Save Rule
   → Click "Create Rule"

Step 6: Monitor Alerts
   → View alerts on dashboard
   → Acknowledge when addressed
```

---

## 7. Tips & Best Practices

### 7.1 Pipeline Design Tips

1. **Test Connectors First**: Always test connectors before using in pipelines
2. **Use Descriptive Names**: Name pipelines clearly (e.g., "Daily User Sync - CRM to DB")
3. **Start Simple**: Begin with source → destination, add transformations later
4. **Use Dry Run**: Test pipelines before executing with real data
5. **Monitor Execution**: Check logs regularly for issues
6. **Version Control**: Save multiple versions before major changes (coming in Phase 2)

### 7.2 Connector Management Tips

1. **Reuse Connectors**: Create one connector, use in multiple pipelines
2. **Test Regularly**: Test connections periodically to catch issues
3. **Secure Credentials**: Use environment variables or secrets management
4. **Document Settings**: Add clear descriptions to connectors
5. **Monitor Status**: Check connector status indicators regularly

### 7.3 Transformation Tips

1. **Keep It Simple**: One transformation per node when possible
2. **Test with Sample Data**: Use small datasets to test logic
3. **Document Logic**: Add clear descriptions to transformation rules
4. **Reuse Common Transforms**: Create reusable transformations (Phase 2)
5. **Validate Output**: Check transformation results before production

---

## 8. Troubleshooting

### 8.1 Common Issues

#### **Issue: "New Pipeline" button not visible**
**Cause**: Insufficient permissions
**Solution**:
- Check your role (must be Admin, Developer, or Designer)
- Contact admin to upgrade permissions

#### **Issue: Cannot edit pipeline**
**Cause**: Pipeline is locked or insufficient permissions
**Solution**:
- Check if pipeline is running (cancel first)
- Verify you have edit permissions
- Refresh page and try again

#### **Issue: Connector test fails**
**Cause**: Configuration error or network issue
**Solution**:
- Verify connection details (host, port, credentials)
- Check network connectivity
- Review error message for specific issue
- Test connection from terminal/CLI if needed

#### **Issue: Pipeline execution fails immediately**
**Cause**: Configuration error or missing connector
**Solution**:
- Check execution logs for error details
- Verify all nodes are properly configured
- Ensure connectors are active and tested
- Review pipeline validation errors

### 8.2 Getting Help

**In-App Help**:
- Click "Help" in sidebar navigation
- View documentation sections
- Search for specific topics

**Support Channels**:
- Contact system administrator
- Check activity logs: `/admin/activity`
- Review execution logs: `/pipelines/{id}/executions`

---

## 9. Future Enhancements (Coming Soon)

### Phase 2 Features:
- ✨ **Transformation Function Library** (`/transformations/functions`)
  - Browse built-in transformation functions
  - Create custom reusable transformations
  - Test transformations with sample data
  - View usage examples

- ✨ **Pipeline Versioning** (`/pipelines/{id}/versions`)
  - View version history
  - Compare versions (diff)
  - Rollback to previous versions
  - Tag versions with notes

- ✨ **Log Analysis Tools** (`/logs`)
  - Centralized log viewer
  - Advanced search and filtering
  - Correlation ID tracking
  - Error trend visualization

- ✨ **Enhanced Transformation Editor**
  - Full edit capability for transformations
  - Visual transformation builder
  - Real-time preview of transformations
  - Schema mapping interface

---

## 10. Summary

### Quick Access for Developer Users:

**To Create a Pipeline**:
```
Sidebar → Pipelines → New Pipeline → Build visually → Save → Execute
```

**To Configure a Connector**:
```
Sidebar → Connectors → New Connector → Select type → Configure → Test → Save
```

**To Manage Transformations**:
```
Sidebar → Transformations → View/Test/Delete
(Create via Pipeline Builder)
```

**To Monitor Pipelines**:
```
Sidebar → Pipelines → Click pipeline → Executions → View logs
```

**To Set Up Alerts**:
```
Sidebar → Alerts → Manage Rules → New Rule → Configure → Save
```

---

## Conclusion

The Data Aggregator Platform provides comprehensive, user-friendly UIs for configuring all aspects of data pipelines. As a **Developer user**, you have nearly full access to all configuration capabilities, with the exception of modifying the admin user.

The visual pipeline builder makes it easy to create complex data workflows without writing code, while still providing the flexibility to define custom transformations and configurations.

For additional help, refer to the in-app documentation or contact your system administrator.

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**Next Update**: After Phase 2 completion (Transformation Function Library)
