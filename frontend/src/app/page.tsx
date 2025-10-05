'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [isAuthenticated, checkAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  );
}
