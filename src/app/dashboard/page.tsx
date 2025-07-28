'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLoading } from './components/ui/DashboardLoading';
import GlobalLoading from '@/components/ui/common/GlobalLoading';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/select');
  }, [router]);

  return <GlobalLoading message="Redirecting to dashboard..." />;
}
