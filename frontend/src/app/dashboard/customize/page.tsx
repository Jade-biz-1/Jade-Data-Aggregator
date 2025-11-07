'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';

export default function DashboardCustomizePage() {
  const router = useRouter();
  const { features, loading: permissionsLoading } = usePermissions();

  const handleSave = () => {
    // Redirect to main dashboard after saving
    router.push('/dashboard');
  };

  // Check permission to view this page
  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.dashboard?.customize) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to customize the dashboard." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customize Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Drag and drop widgets to create your perfect dashboard layout
          </p>
        </div>

        <DashboardCustomizer onSave={handleSave} />
      </div>
    </DashboardLayout>
  );
}
