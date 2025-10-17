# Data Aggregator Platform - User Documentation Update

**Version**: 2.0
**Date**: October 17, 2025
**Update Type**: Feature Release - UI Integration Complete
**Last Updated**: Complete UI/API Integration (Sprints 1-5)

---

## 📋 Document Purpose

This document updates the existing User Guide with information about newly completed features from the comprehensive UI integration project (Sprints 1-5). All features described here are **PRODUCTION READY** and fully functional.

---

## 🎉 What's New

### Major Updates

All pages in the Data Aggregator Platform now feature:
- ✅ **Full Backend API Integration** - No mock data remaining
- ✅ **Toast Notification System** - Immediate visual feedback for all actions
- ✅ **Permission-Based Access Control** - Role-based UI restrictions
- ✅ **Consistent Error Handling** - User-friendly error messages
- ✅ **Loading States** - Clear indicators for async operations
- ✅ **Empty State Guidance** - Helpful messages when no data is available

---

## 📚 Updated Features by Section

### 1. Dashboard

**Location**: `/dashboard`

**New Features**:
- **Real-Time Data**: All widgets display live data from the backend
- **System Status**: Live system health indicators
- **Recent Activity**: Real-time activity feed
- **Performance Metrics**: Actual processing times and throughput
- **Quick Actions**: One-click access to common tasks

**How to Use**:
1. Navigate to the dashboard after login
2. View system overview cards (pipelines, connectors, records processed)
3. Check recent activity in the activity feed
4. Monitor system health in the health indicators panel
5. Click any metric card to drill down into details

**Permissions Required**: `dashboard.view`

---

### 2. Pipeline Management

**Location**: `/pipelines`

**New Features**:
- **Full CRUD Operations**: Create, read, update, delete pipelines via UI
- **Pipeline Execution**: Run pipelines directly from the list
- **Status Tracking**: Real-time execution status updates
- **Quick Actions**: Edit, run, delete with confirmation dialogs
- **Search & Filter**: Find pipelines quickly
- **Toast Notifications**: Success/error feedback for all actions

**How to Use**:

**Create a Pipeline**:
1. Click "New Pipeline" button
2. Fill in pipeline name and description
3. Select source connector
4. Select destination connector
5. Add transformations (optional)
6. Configure scheduling
7. Click "Create Pipeline"
8. See success toast notification

**Run a Pipeline**:
1. Find your pipeline in the list
2. Click the "Run" button (play icon)
3. Confirm in the dialog
4. Monitor status in real-time
5. View results when complete

**Edit a Pipeline**:
1. Click the "Edit" button (pencil icon)
2. Modify fields as needed
3. Click "Save Changes"
4. See confirmation toast

**Delete a Pipeline**:
1. Click the "Delete" button (trash icon)
2. Confirm deletion in the dialog
3. Pipeline removed with toast confirmation

**Permissions Required**:
- `pipelines.view` - View pipelines
- `pipelines.create` - Create new pipelines
- `pipelines.edit` - Modify existing pipelines
- `pipelines.delete` - Remove pipelines
- `pipelines.execute` - Run pipelines

---

### 3. Visual Pipeline Builder

**Location**: `/pipeline-builder`

**New Features**:
- **Drag-and-Drop Canvas**: Visual pipeline creation with React Flow
- **Node Palette**: Pre-built nodes for sources, transformations, destinations
- **Node Configuration**: Configure each node with dynamic forms
- **Pipeline Validation**: Real-time validation with error indicators
- **Dry-Run Testing**: Test pipelines without processing real data
- **Pipeline Execution**: Run pipelines from the builder
- **Template Browser**: Use pre-built pipeline templates
- **Auto-Layout**: Automatic node arrangement
- **Minimap**: Navigate large pipelines easily
- **Save/Load**: Persist pipelines to database

**How to Use**:

**Create a Visual Pipeline**:
1. Navigate to `/pipeline-builder`
2. Drag nodes from the palette onto the canvas:
   - **Source Nodes**: Database, API, File
   - **Transformation Nodes**: Filter, Map, Sort, Aggregate
   - **Destination Nodes**: Database, File, Warehouse, API
3. Connect nodes by dragging from one node's output to another's input
4. Click any node to configure its properties
5. Use "Validate Pipeline" to check for errors
6. Click "Save Pipeline" and provide a name
7. See success toast notification

**Configure Nodes**:
1. Click on any node in the canvas
2. Configuration panel appears on the right
3. Fill in required fields (highlighted in red if missing)
4. Use "Test Node" to validate individual node configuration
5. Click "Save" to apply changes

**Test Pipeline (Dry-Run)**:
1. Build your pipeline as above
2. Click "Test Pipeline" button
3. View sample data flow through each node
4. Check execution time estimates
5. Fix any issues identified

**Execute Pipeline**:
1. Complete pipeline must be saved first
2. Click "Run Pipeline" button
3. Monitor execution progress in real-time
4. View logs in the execution panel
5. Use "Cancel" to stop if needed

**Load Template**:
1. Click "Browse Templates" button
2. View available templates by category
3. Preview template structure
4. Click "Use Template" to load
5. Customize as needed and save

**Permissions Required**:
- `pipelines.create` - Create visual pipelines
- `pipelines.edit` - Modify existing pipelines
- `pipelines.execute` - Run pipelines

---

### 4. Connectors

**Location**: `/connectors`

**New Features**:
- **Connector List**: View all configured connectors
- **Test Connection**: Validate connector configuration before saving
- **Connection Status**: Live status indicators
- **Quick Actions**: Edit, test, delete with confirmations
- **Toast Notifications**: Immediate feedback for all operations

**How to Use**:

**Create a Connector**:
1. Navigate to `/connectors`
2. Click "New Connector" button
3. Choose connector type (Database, API, File, etc.)
4. You'll be redirected to `/connectors/configure`
5. Select specific connector (PostgreSQL, MySQL, REST API, etc.)
6. Fill in connection parameters
7. Click "Test Connection" to validate
8. If successful, click "Save Connector"
9. See success toast notification

**Test an Existing Connector**:
1. Find connector in the list
2. Click "Test" button
3. Wait for test results
4. Green checkmark = success, red X = failure
5. View error details if test fails

**Edit a Connector**:
1. Click "Edit" button (pencil icon)
2. Modify connection parameters
3. Test connection again
4. Click "Save Changes"
5. See confirmation toast

**Delete a Connector**:
1. Click "Delete" button (trash icon)
2. Confirm deletion (warning if used in pipelines)
3. Connector removed with toast confirmation

**Supported Connector Types**:
- **Databases**: PostgreSQL, MySQL, MongoDB, Oracle, SQL Server
- **APIs**: REST APIs with various authentication methods
- **Files**: Local files, FTP, SFTP, AWS S3, Azure Blob, Google Cloud Storage
- **SaaS**: Salesforce, HubSpot, Google Sheets
- **Data Warehouses**: Snowflake, BigQuery, Redshift

**Permissions Required**:
- `connectors.view` - View connectors
- `connectors.create` - Create new connectors
- `connectors.edit` - Modify existing connectors
- `connectors.delete` - Remove connectors
- `connectors.test` - Test connections

---

### 5. Transformations

**Location**: `/transformations`

**New Features**:
- **Transformation List**: View all configured transformations
- **Test Transformation**: Run with sample data
- **Status Indicators**: Active/inactive state
- **Records Processed**: Track transformation usage
- **Quick Actions**: Run, edit, delete with confirmations
- **Toast Notifications**: Feedback for all operations

**How to Use**:

**Create a Transformation**:
1. Navigate to `/transformations`
2. Click "New Transformation" button
3. Enter transformation name and description
4. Select transformation type:
   - **Data Normalization**: Standardize formats
   - **Currency Conversion**: Convert between currencies
   - **Deduplication**: Remove duplicate records
   - **Data Validation**: Validate against rules
   - **Custom**: Write custom transformation logic
5. Configure source and target fields
6. Define transformation rules
7. Click "Create Transformation"
8. See success toast

**Test a Transformation**:
1. Find transformation in the list
2. Click "Run" button (play icon)
3. Provide sample input data
4. View transformed output
5. Check for errors or warnings

**Edit a Transformation**:
1. Click "Edit" button (pencil icon)
2. Modify rules and configuration
3. Test with sample data
4. Click "Save Changes"
5. See confirmation toast

**Delete a Transformation**:
1. Click "Delete" button (trash icon)
2. Confirm deletion (warning if used in pipelines)
3. Transformation removed with toast confirmation

**Permissions Required**:
- `transformations.view` - View transformations
- `transformations.create` - Create new transformations
- `transformations.edit` - Modify existing transformations
- `transformations.delete` - Remove transformations
- `transformations.execute` - Test transformations

---

### 6. Analytics

**Location**: `/analytics`

**New Features**:
- **Real-Time Metrics**: Live data processing statistics
- **Interactive Charts**: Data volume trends, pipeline performance
- **Time Range Selector**: View data for different periods (24h, 7d, 30d, 90d)
- **Top Performing Pipelines**: Ranked by success rate and volume
- **Data Sources Overview**: Summary of all data sources
- **Export Capability**: Export analytics data (UI ready)
- **Toast Notifications**: Feedback when data loads

**How to Use**:

**View Analytics**:
1. Navigate to `/analytics`
2. Review key metrics cards:
   - Records Processed
   - Average Processing Time
   - Success Rate
   - Active Pipelines
3. Check data volume trend chart
4. View pipeline success rate bar chart
5. Review top performing pipelines list

**Change Time Range**:
1. Click time range dropdown (top right)
2. Select period: 24 Hours, 7 Days, 30 Days, 90 Days
3. Charts and metrics update automatically

**Export Data** (feature available):
1. Click "Export" button
2. Choose format (CSV, Excel, PDF)
3. Data downloads to your computer

**Permissions Required**: `analytics.view`

---

### 7. Monitoring

**Location**: `/monitoring`, `/monitoring/live`, `/monitoring/performance`

**New Features**:
- **Real-Time Dashboard**: Live pipeline status and metrics
- **System Health**: Monitor all system components
- **Performance Tracking**: CPU, memory, throughput metrics
- **Alert Management**: View and respond to system alerts
- **Time Range Filtering**: 1h, 24h, 7d, 30d views
- **Live Updates**: Automatic refresh every few seconds
- **Toast Notifications**: Alerts for critical events

**How to Use**:

**Main Monitoring** (`/monitoring`):
1. Navigate to `/monitoring`
2. View key statistics:
   - Active Pipelines
   - Running Pipelines
   - Records Processed
   - Success Rate
3. Check pipeline performance section
4. Review recent alerts
5. Monitor system health indicators

**Live Monitoring** (`/monitoring/live`):
1. Navigate to `/monitoring/live`
2. View real-time pipeline execution
3. See data flowing through pipelines
4. Monitor resource usage
5. Respond to alerts as they appear

**Performance Monitoring** (`/monitoring/performance`):
1. Navigate to `/monitoring/performance`
2. View detailed performance metrics
3. Check resource utilization graphs
4. Identify bottlenecks
5. Export performance reports

**Permissions Required**: `monitoring.view`

---

### 8. File Management

**Location**: `/files`

**New Features**:
- **File Upload**: Drag-and-drop or browse to upload
- **File Preview**: View CSV, JSON, text, and image files
- **File Download**: Download any uploaded file
- **File Status**: Track upload/processing status
- **Search & Filter**: Find files quickly
- **File Metadata**: View size, type, upload date
- **Toast Notifications**: Feedback for all file operations

**How to Use**:

**Upload Files**:
1. Navigate to `/files`
2. Click "Upload Files" button
3. Drag files onto upload area OR click to browse
4. Supported formats: CSV, JSON, XLSX, TXT, XML
5. Max file size: 100 MB
6. Multiple files supported
7. Monitor upload progress
8. See success toast when complete

**Preview Files**:
1. Find file in the list
2. Click "Preview" button (eye icon)
3. View file contents in modal:
   - CSV/JSON: Table view (first 100 rows)
   - Text: Raw text content
   - Images: Full image display
4. Click X to close preview

**Download Files**:
1. Find file in the list
2. Click "Download" button
3. File downloads to your computer
4. See success toast

**Delete Files**:
1. Find file in the list
2. Click "Delete" button (trash icon)
3. Confirm deletion
4. File removed with toast confirmation

**Filter Files**:
1. Use search box to find files by name
2. Use status dropdown to filter:
   - All Files
   - Completed
   - Processing
   - Failed

**Permissions Required**:
- `files.view` - View file list
- `files.upload` - Upload new files
- `files.download` - Download files
- `files.delete` - Remove files

---

### 9. Dashboard Customization

**Location**: `/dashboard/customize`

**New Features**:
- **Widget Library**: 6 pre-built widget types
- **Drag-and-Drop**: Arrange widgets visually
- **Widget Sizing**: Small, medium, large sizes
- **Layout Templates**: Save and load custom layouts
- **Widget Configuration**: Customize each widget
- **Auto-Save**: Layouts persist automatically
- **Toast Notifications**: Feedback for all actions

**How to Use**:

**Customize Dashboard**:
1. Navigate to `/dashboard/customize`
2. Enter dashboard name
3. Click "Add Widget" button
4. Select widget type:
   - **Bar Chart**: Display data as bars
   - **Line Chart**: Show trends over time
   - **Pie Chart**: Visualize proportions
   - **Metrics**: Key performance indicators
   - **Data Table**: Display tabular data
   - **Pipeline Status**: Monitor pipeline health
5. Drag widgets to rearrange
6. Click widget settings icon to configure
7. Click widget copy icon to duplicate
8. Click widget trash icon to remove
9. Click "Save Layout" when done
10. See success toast confirmation

**Use Templates**:
1. Click "Templates" button
2. View available layouts
3. Click "Load" on desired template
4. Customize as needed
5. Save with a new name

**Change Widget Size**:
1. Click settings icon on any widget
2. Size cycles through: Small → Medium → Large → Small
3. Changes apply immediately

**Permissions Required**: `dashboard.customize`

---

### 10. Global Search

**Location**: `/search`

**New Features**:
- **Universal Search**: Search across all entity types
- **Entity Filtering**: Filter by pipelines, connectors, transformations, users
- **Match Scores**: See relevance scores for results
- **Search History**: View recent searches
- **Saved Searches**: Save frequently used queries
- **Real-Time Results**: Instant search as you type
- **Toast Notifications**: Feedback for save/delete operations

**How to Use**:

**Perform a Search**:
1. Navigate to `/search`
2. Enter search query in search box
3. Optionally select entity types to filter:
   - Pipelines
   - Connectors
   - Transformations
   - Users
4. Press Enter or click "Search"
5. View results with match scores
6. Click any result to view details

**Save a Search**:
1. Perform a search
2. Click bookmark icon (right of search box)
3. Enter name for saved search
4. Click "Save"
5. See success toast

**Use Saved Search**:
1. View "Saved Searches" panel (left sidebar)
2. Click on any saved search name
3. Search executes automatically
4. To delete: click X icon next to saved search

**View Search History**:
1. View "Recent Searches" panel (left sidebar)
2. Click any previous query to re-run
3. See result count from previous search

**Clear Filters**:
1. Click "Clear" button next to Filters
2. All entity type filters removed

**Permissions Required**: `search.view`

---

### 11. Settings

**Location**: `/settings`

**New Features**:
- **Profile Management**: Update name, email, username
- **Password Change**: Secure password update with validation
- **Notification Preferences**: Email, push, pipeline alerts, connector alerts
- **Security Settings**: Two-factor auth, login alerts, session timeout
- **Timezone Configuration**: Set your timezone
- **Toast Notifications**: Immediate feedback for all settings changes
- **Real-Time Save**: All settings persist to backend

**How to Use**:

**Update Profile**:
1. Navigate to `/settings`
2. Click "Profile" tab (default)
3. Update fields:
   - First Name
   - Last Name
   - Username
   - Email
   - Timezone
4. Click "Save Profile"
5. See success toast

**Change Password**:
1. Click "Password" tab
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Use eye icons to show/hide passwords
6. Click "Update Password"
7. See success toast
8. Form clears automatically

**Configure Notifications**:
1. Click "Notifications" tab
2. Toggle switches for:
   - Email Notifications
   - Push Notifications
   - Pipeline Alerts
   - Connector Alerts
3. Click "Save Notification Settings"
4. See success toast

**Configure Security**:
1. Click "Security" tab
2. Toggle switches for:
   - Two-Factor Authentication
   - Login Alerts
3. Set Session Timeout dropdown:
   - 15 minutes
   - 30 minutes
   - 1 hour
   - 2 hours
   - Never
4. Click "Save Security Settings"
5. See success toast

**Permissions Required**: `settings.view`

---

## 🎨 User Experience Improvements

### Toast Notifications

All actions now provide immediate visual feedback:

**Success Notifications** (Green):
- "Pipeline created successfully"
- "Connector tested successfully"
- "Settings saved successfully"
- etc.

**Error Notifications** (Red):
- "Failed to load pipelines"
- "Connection test failed"
- "Invalid configuration"
- etc.

**Warning Notifications** (Yellow):
- "Please enter a search query"
- "No results found"
- "File upload in progress"
- etc.

**Toast Features**:
- Appear at top-right of screen
- Auto-dismiss after 5 seconds
- Click X to dismiss manually
- Multiple toasts stack vertically
- Color-coded by type

---

### Loading States

All pages show loading indicators during async operations:

**Spinner Indicators**:
- Full-page loading: Centered spinner with "Loading..." message
- Button loading: Button shows "Saving..." or "Loading..."
- Card loading: Skeleton loaders for card content

**Best Practices**:
- Wait for loading to complete before navigating away
- Don't click buttons multiple times (prevents duplicate actions)
- Use loading indicators to gauge operation progress

---

### Empty States

When no data is available, helpful messages guide you:

**Empty Pipeline List**:
- Message: "No pipelines created yet"
- Guidance: "Get started by creating your first pipeline"
- Action: "Create Pipeline" button

**Empty Search Results**:
- Message: "No results found"
- Guidance: "Try adjusting your search or filters"
- Action: Suggestions for refining search

**Empty Analytics**:
- Message: "No data available yet"
- Guidance: "Run some pipelines to see analytics"
- Action: Link to create pipeline

---

### Permission-Based UI

UI elements adapt based on your role:

**Admin Role**:
- Full access to all features
- All buttons and actions visible
- Can manage users and system settings

**Editor Role**:
- Can create/edit pipelines, connectors, transformations
- Cannot access user management
- Cannot access system settings

**Viewer Role**:
- Read-only access
- Create/Edit/Delete buttons hidden
- Can view dashboards, analytics, monitoring

**Access Denied Screen**:
- Shown when accessing unauthorized features
- Clear message explaining permission requirement
- Link to contact admin for access

---

## 🔧 Troubleshooting

### Common Issues and Solutions

**Issue**: "Failed to load data" error on any page

**Solutions**:
1. Check your internet connection
2. Verify backend API is running (http://localhost:8001/docs)
3. Check browser console for specific errors (F12)
4. Try refreshing the page (F5)
5. Clear browser cache and cookies
6. Contact admin if issue persists

---

**Issue**: "Access Denied" message appears

**Solutions**:
1. Verify you're logged in (check top-right menu)
2. Check your user role (Settings → Profile)
3. Contact admin to request necessary permissions
4. Confirm feature is available in your plan

---

**Issue**: Toast notification appears but nothing happens

**Solutions**:
1. Read the toast message carefully for error details
2. Check form fields for validation errors (red highlights)
3. Try the action again
4. Check backend API logs for detailed errors
5. Contact support with error message details

---

**Issue**: File upload fails

**Solutions**:
1. Check file size (max 100 MB)
2. Verify file format is supported
3. Ensure you have `files.upload` permission
4. Check available disk space
5. Try a smaller file first

---

**Issue**: Pipeline builder node connections don't work

**Solutions**:
1. Ensure nodes are compatible (source → transform → destination)
2. Try zooming in for easier connection
3. Drag from output (right side) to input (left side)
4. Refresh page if connections disappear
5. Save frequently to prevent data loss

---

## 📞 Getting Help

### Support Resources

**Documentation**:
- Full User Guide: `docs/UserGuide.md`
- API Documentation: http://localhost:8001/docs
- Architecture Guide: `docs/architecture.md`
- Troubleshooting Guide: `docs/troubleshooting.md`

**In-App Help**:
- Tooltips on hover (most UI elements)
- Placeholder text in forms
- Empty state guidance messages
- Error messages with suggestions

**Contact Support**:
- Email: support@dataaggregator.com
- Slack: #dataaggregator-support
- GitHub Issues: https://github.com/your-org/dataaggregator/issues

---

## 🎓 Training Resources

### Video Tutorials (Coming Soon)

1. Getting Started with Data Aggregator
2. Creating Your First Pipeline
3. Visual Pipeline Builder Tutorial
4. Advanced Transformations
5. Monitoring and Analytics Deep Dive

### Interactive Demos

Access interactive demos at: `/demos` (coming soon)

---

## 📝 Change Log

### October 17, 2025 - Major UI Integration Update

**New Features**:
- Complete backend API integration for all pages
- Visual pipeline builder with drag-and-drop
- Real-time monitoring and analytics
- Global search across all entities
- Dashboard customization
- File upload and management
- Toast notification system
- Permission-based access control

**Improvements**:
- Consistent error handling across all pages
- Loading states for better user feedback
- Empty state guidance messages
- Better mobile responsive design
- Improved navigation and breadcrumbs
- Faster page load times

**Bug Fixes**:
- Fixed authentication token refresh
- Corrected timezone handling
- Resolved duplicate API calls
- Fixed file upload progress tracking
- Corrected chart data refresh

---

## 🚀 Next Steps for Users

1. **Explore the Dashboard**: Familiarize yourself with the updated interface
2. **Create a Test Pipeline**: Use the visual builder to create a simple pipeline
3. **Configure Notifications**: Set up alerts for pipeline failures
4. **Customize Your Dashboard**: Add widgets relevant to your workflow
5. **Save Frequently Used Searches**: Use the global search feature
6. **Review Analytics**: Monitor pipeline performance regularly

---

## 📋 Quick Reference Card

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Global Search | `/` (forward slash) |
| Save (in forms) | `Ctrl/Cmd + S` |
| Cancel/Close | `Esc` |
| Help | `?` |

### Common Actions

| Task | Location | Key Buttons |
|------|----------|-------------|
| Create Pipeline | `/pipelines` | "New Pipeline" |
| View Analytics | `/analytics` | Time range dropdown |
| Upload File | `/files` | "Upload Files" |
| Test Connector | `/connectors` | "Test" button |
| Run Pipeline | `/pipelines` | Play icon |
| Search | `/search` | Search box + Enter |

### Permission Matrix

| Feature | Admin | Editor | Viewer |
|---------|-------|--------|--------|
| View Pipelines | ✅ | ✅ | ✅ |
| Create Pipelines | ✅ | ✅ | ❌ |
| Delete Pipelines | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ✅ |
| Customize Dashboard | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |

---

**Document Version**: 2.0
**Last Updated**: October 17, 2025
**Status**: Production Ready
**Applies to**: Data Aggregator Platform v2.0+

---

*For the complete User Guide with detailed examples and technical information, refer to `docs/UserGuide.md`.*
