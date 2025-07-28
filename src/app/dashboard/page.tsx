'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import { Sidebar } from '@/components/ui/common/sidebar';
import { CompanyModal } from '@/components/ui/common/CompanyModal';
import Navbar from '@/components/ui/common/navbar';
import GlobalLoading from '@/components/ui/common/GlobalLoading';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  useEffect(() => {
    dispatch({
      type: 'ui/initializeComponent',
      payload: {
        type: 'sidebar',
        id: 'sidebar-chat',
        isOpenFromUrl: true,
      },
    });
  }, [dispatch]);

  useEffect(() => {
    router.replace('/dashboard/select');
  }, [router]);

  const handleSidebarCollapse = () => {
    dispatch(toggleComponent({ id: 'sidebar-chat' }));
  };

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-x-hidden ml-0">
        {/* Header */}
        <Navbar
          title="Dashboard"
          isCollapsed={isSidebarCollapsed}
          className="!h-[3.8rem]"
          collpaseSidebar={handleSidebarCollapse}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <GlobalLoading message="Redirecting to dashboard..." />
        </main>
      </div>
      <CompanyModal />
    </div>
  );
}
