'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import { useRouter } from 'next/navigation';

export default function DashboardCustomizePage() {
  const router = useRouter();

  const handleSave = () => {
    // Redirect to main dashboard after saving
    router.push('/dashboard');
  };

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
