# Phase 8 Frontend Implementation Guide

**Status:** Backend Complete | Frontend In Progress
**Date:** October 10, 2025

---

## ✅ Completed Frontend Files

### 1. Custom Hooks
- **`frontend/src/hooks/usePermissions.ts`** ✅ CREATED
  - Custom hook for managing permissions
  - Fetches user permissions, navigation, and feature access
  - Provides helper functions: `hasPermission()`, `canAccessRoute()`, etc.
  - Checks for developer role warning in production

### 2. Components
- **`frontend/src/components/layout/DevWarningBanner.tsx`** ✅ CREATED
  - Warning banner for developer role in production
  - Shows expiration countdown
  - Auto-hides when not active

---

## 📝 Remaining Frontend Implementation

### F035: Role-Based Navigation ⏳ IN PROGRESS

**Files to Update:**

1. **`frontend/src/components/layout/sidebar.tsx`**
   ```typescript
   // Add usePermissions hook
   import { usePermissions } from '@/hooks/usePermissions';

   export function Sidebar() {
     const { navigation, loading } = usePermissions();

     // Filter navigation items based on permissions
     const visibleNavigation = navigation ? [
       { name: 'Dashboard', href: '/dashboard', icon: Home, visible: navigation.dashboard },
       { name: 'Pipelines', href: '/pipelines', icon: GitBranch, visible: navigation.pipelines },
       { name: 'Connectors', href: '/connectors', icon: Database, visible: navigation.connectors },
       { name: 'Transformations', href: '/transformations', icon: Code, visible: navigation.transformations },
       { name: 'Analytics', href: '/analytics', icon: BarChart3, visible: navigation.analytics },
       { name: 'Monitoring', href: '/monitoring', icon: Activity, visible: navigation.monitoring },
       { name: 'Users', href: '/users', icon: Users, visible: navigation.users },
       { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench, visible: navigation.maintenance },
     ].filter(item => item.visible) : [];

     return <aside>...</aside>;
   }
   ```

2. **`frontend/src/components/layout/dashboard-layout.tsx`**
   ```typescript
   import { DevWarningBanner } from './DevWarningBanner';
   import { usePermissions } from '@/hooks/usePermissions';

   export function DashboardLayout({ children }) {
     const { devWarning } = usePermissions();

     return (
       <div>
         <DevWarningBanner warning={devWarning} />
         <Sidebar />
         <main>{children}</main>
       </div>
     );
   }
   ```

3. **`frontend/src/middleware.ts`** (CREATE NEW)
   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     // Check authentication
     const token = request.cookies.get('auth_token');

     if (!token && !request.nextUrl.pathname.startsWith('/auth')) {
       return NextResponse.redirect(new URL('/auth/login', request.url));
     }

     return NextResponse.next();
   }

   export const config = {
     matcher: [
       '/dashboard/:path*',
       '/pipelines/:path*',
       '/connectors/:path*',
       '/transformations/:path*',
       '/analytics/:path*',
       '/monitoring/:path*',
       '/users/:path*',
       '/admin/:path*',
     ],
   };
   ```

---

### F036: Enhanced User Management UI

**Files to Update:**

1. **`frontend/src/app/users/page.tsx`**
   - Add role selector with 6 roles
   - Add role descriptions
   - Show admin user protection indicators
   - Disable actions for admin user (if not admin role)
   - Add production warning for developer role

2. **Create: `frontend/src/components/users/UserRoleSelector.tsx`**
   ```typescript
   import { useState, useEffect } from 'react';

   interface Role {
     role: string;
     title: string;
     description: string;
     level: number;
   }

   export function UserRoleSelector({ value, onChange, disabled }) {
     const [roles, setRoles] = useState<Role[]>([]);

     useEffect(() => {
       fetch('/api/v1/roles')
         .then(res => res.json())
         .then(data => setRoles(data.roles));
     }, []);

     return (
       <select value={value} onChange={onChange} disabled={disabled}>
         {roles.map(role => (
           <option key={role.role} value={role.role}>
             {role.title} - {role.description}
           </option>
         ))}
       </select>
     );
   }
   ```

3. **Create: `frontend/src/components/users/UserActionsMenu.tsx`**
   ```typescript
   export function UserActionsMenu({ user, currentUser, onAction }) {
     const { features, permissions } = usePermissions();
     const isAdminUser = user.username === 'admin';
     const canModify = features?.users.edit && (!isAdminUser || permissions?.role === 'admin');

     return (
       <DropdownMenu>
         <DropdownMenuItem disabled={!canModify} onClick={() => onAction('edit')}>
           Edit User
         </DropdownMenuItem>
         <DropdownMenuItem
           disabled={!features?.users.reset_password || (isAdminUser && permissions?.role !== 'admin')}
           onClick={() => onAction('reset-password')}
         >
           Reset Password
           {isAdminUser && <Lock className="ml-2 h-4 w-4" />}
         </DropdownMenuItem>
         <DropdownMenuItem
           disabled={!features?.users.delete || isAdminUser}
           onClick={() => onAction('delete')}
         >
           Delete User
           {isAdminUser && <span className="text-xs text-red-500">(Protected)</span>}
         </DropdownMenuItem>
       </DropdownMenu>
     );
   }
   ```

---

### F037: Role-Based Feature Visibility

**Pattern to Apply Across All Pages:**

```typescript
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function PipelinesPage() {
  const { features, loading } = usePermissions();

  if (loading) return <LoadingSpinner />;

  if (!features?.pipelines.view) {
    return <AccessDenied message="You don't have permission to view pipelines" />;
  }

  return (
    <div>
      <h1>Pipelines</h1>

      {features.pipelines.create && (
        <button onClick={createPipeline}>Create Pipeline</button>
      )}

      <PipelineList
        onEdit={features.pipelines.edit ? handleEdit : undefined}
        onDelete={features.pipelines.delete ? handleDelete : undefined}
        onExecute={features.pipelines.execute ? handleExecute : undefined}
      />
    </div>
  );
}
```

**Pages to Update:**
- `frontend/src/app/pipelines/page.tsx`
- `frontend/src/app/connectors/page.tsx`
- `frontend/src/app/transformations/page.tsx`
- `frontend/src/app/analytics/page.tsx`
- `frontend/src/app/monitoring/page.tsx`

---

### F038: Admin Password Reset UI Protection

**File to Update: `frontend/src/app/users/page.tsx`**

```typescript
const handleResetPassword = async (user: User) => {
  const { permissions } = usePermissions();

  // Check if user is admin
  if (user.username === 'admin') {
    if (permissions?.role !== 'admin') {
      showToast('error', 'Cannot reset admin user password. Developer role cannot modify admin user.');
      return;
    }

    showDialog({
      title: 'Admin Password Reset Blocked',
      message: 'Admin user password cannot be reset via this method. Please use "Change Password" functionality instead.',
      type: 'warning',
    });
    return;
  }

  // Proceed with normal password reset
  await resetPassword(user.id);
};
```

---

### F039-F041: System Maintenance Dashboard

**Create These Files:**

1. **`frontend/src/app/admin/maintenance/page.tsx`**
   ```typescript
   'use client';

   import { useState, useEffect } from 'react';
   import { CleanupResults } from '@/components/admin/CleanupResults';
   import { CleanupScheduler } from '@/components/admin/CleanupScheduler';
   import { SystemStats } from '@/components/admin/SystemStats';

   export default function MaintenancePage() {
     const [stats, setStats] = useState(null);
     const [cleanupResults, setCleanupResults] = useState(null);

     useEffect(() => {
       fetchStats();
     }, []);

     const fetchStats = async () => {
       const response = await fetch('/api/v1/admin/cleanup/stats');
       const data = await response.json();
       setStats(data);
     };

     const runCleanup = async (type: string) => {
       const response = await fetch(`/api/v1/admin/cleanup/${type}`, {
         method: 'POST',
       });
       const result = await response.json();
       setCleanupResults(result);
       fetchStats(); // Refresh stats
     };

     return (
       <div className="p-6 space-y-6">
         <h1>System Maintenance</h1>

         <SystemStats stats={stats} />

         <div className="grid grid-cols-2 gap-4">
           <button onClick={() => runCleanup('activity-logs')}>
             Clean Activity Logs
           </button>
           <button onClick={() => runCleanup('temp-files')}>
             Clean Temp Files
           </button>
           <button onClick={() => runCleanup('orphaned-data')}>
             Clean Orphaned Data
           </button>
           <button onClick={() => runCleanup('all')}>
             Run All Cleanup
           </button>
         </div>

         {cleanupResults && (
           <CleanupResults results={cleanupResults} />
         )}

         <CleanupScheduler />
       </div>
     );
   }
   ```

2. **`frontend/src/components/admin/CleanupResults.tsx`**
   ```typescript
   export function CleanupResults({ results }) {
     return (
       <div className="bg-white rounded-lg shadow p-6">
         <h3>Cleanup Results</h3>
         <div className="mt-4 space-y-2">
           {results.operations && Object.entries(results.operations).map(([key, value]: any) => (
             <div key={key} className="flex justify-between">
               <span>{key}:</span>
               <span className="font-semibold">
                 {value.records_deleted || value.files_deleted || 0} items removed
               </span>
             </div>
           ))}
         </div>
         <div className="mt-4 pt-4 border-t">
           <div className="flex justify-between font-bold">
             <span>Total:</span>
             <span>{results.summary?.total_records_deleted} records, {results.summary?.total_space_freed_mb} MB freed</span>
           </div>
         </div>
       </div>
     );
   }
   ```

3. **`frontend/src/components/admin/CleanupScheduler.tsx`**
   ```typescript
   export function CleanupScheduler() {
     const [schedule, setSchedule] = useState({
       enabled: false,
       activity_log_days: 90,
       execution_log_days: 30,
       temp_file_hours: 24,
     });

     const saveSchedule = async () => {
       await fetch('/api/v1/admin/cleanup/schedule', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(schedule),
       });
     };

     return (
       <div className="bg-white rounded-lg shadow p-6">
         <h3>Cleanup Schedule</h3>
         <form onSubmit={saveSchedule}>
           <label>
             Activity Log Retention (days):
             <input
               type="number"
               value={schedule.activity_log_days}
               onChange={(e) => setSchedule({...schedule, activity_log_days: parseInt(e.target.value)})}
             />
           </label>
           {/* More form fields */}
           <button type="submit">Save Schedule</button>
         </form>
       </div>
     );
   }
   ```

4. **`frontend/src/components/admin/SystemStats.tsx`**
   ```typescript
   export function SystemStats({ stats }) {
     if (!stats) return <div>Loading...</div>;

     return (
       <div className="grid grid-cols-3 gap-4">
         <div className="bg-white rounded-lg shadow p-6">
           <h4>Database Size</h4>
           <p className="text-3xl font-bold">{stats.database.size_mb} MB</p>
         </div>
         <div className="bg-white rounded-lg shadow p-6">
           <h4>Total Records</h4>
           <p className="text-3xl font-bold">
             {Object.values(stats.record_counts).reduce((a: any, b: any) => a + b, 0)}
           </p>
         </div>
         <div className="bg-white rounded-lg shadow p-6">
           <h4>Temp Files</h4>
           <p className="text-3xl font-bold">{stats.temp_files.file_count} files</p>
           <p className="text-sm text-gray-500">{stats.temp_files.total_size_mb} MB</p>
         </div>
       </div>
     );
   }
   ```

---

## 🚀 Quick Implementation Checklist

### High Priority (Core Functionality)
- [ ] Update `sidebar.tsx` with role-based navigation
- [ ] Add `DevWarningBanner` to layout
- [ ] Create route middleware for access control
- [ ] Update `/users` page with 6-role support

### Medium Priority (Enhanced UX)
- [ ] Add `UserRoleSelector` component
- [ ] Implement admin user protection UI
- [ ] Update all pages with `usePermissions` hook
- [ ] Add feature visibility controls

### Low Priority (Maintenance Features)
- [ ] Create maintenance dashboard page
- [ ] Add cleanup results component
- [ ] Add cleanup scheduler component
- [ ] Add system stats component

---

## 📊 Estimated Time

- **F035** (Navigation): 4 hours
- **F036** (User Management): 6 hours
- **F037** (Feature Visibility): 4 hours
- **F038** (Password Protection): 2 hours
- **F039-F041** (Maintenance): 12 hours

**Total**: ~28 hours

---

## 🔧 Testing Checklist

After implementing frontend:

- [ ] Admin can see all navigation items
- [ ] Developer sees warning banner in production
- [ ] Viewer only sees Dashboard, Pipelines (read-only)
- [ ] Designer can access Pipeline Builder
- [ ] Executor can run pipelines
- [ ] Executive can access Analytics
- [ ] Admin user shows protection indicators
- [ ] Developer cannot modify admin user
- [ ] Maintenance dashboard loads stats
- [ ] Cleanup operations work and show results

---

**Status:** Backend 100% Complete | Frontend 10% Complete (2/15 files)
**Next Steps:** Continue with sidebar and layout updates
