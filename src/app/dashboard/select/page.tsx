'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutDashboardIcon, SearchIcon, PlusIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateDashboardModal } from './components/CreateDashboardModal';
import { DashboardCard } from './components/DashboardCard';
import { useDashboards } from '@/hooks/query-hooks/useDashboard';
import { Sidebar } from '@/components/ui/common/sidebar';
import Navbar from '@/components/ui/common/navbar';
import { CompanyModal } from '@/components/ui/common/CompanyModal';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import { useInactiveCompany } from '@/hooks/useInactiveCompany';

export default function DashboardSelectPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  const { data: dashboards, isLoading, error } = useDashboards();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: 'ui/initializeComponent',
      payload: {
        type: 'sidebar',
        id: 'sidebar-chat',
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

  // Debug logging
  console.log('Dashboard Select Page - Raw data:', dashboards);
  console.log('Dashboard Select Page - Loading:', isLoading);
  console.log('Dashboard Select Page - Error:', error);

  // Filter dashboards based on search term
  const filteredDashboards =
    dashboards?.filter(
      (dashboard) =>
        dashboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleDashboardSelect = (dashboardId: string) => {
    router.push(`/dashboard/${dashboardId}`);
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (dashboardId: string) => {
    // Just close the modal - the dashboard list will refresh automatically
    // due to React Query invalidation
    setIsCreateModalOpen(false);
  };

  const handleSidebarCollapse = () => {
    dispatch(toggleComponent({ id: 'sidebar-chat' }));
  };

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Select Dashboard" />;
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <Navbar
            title="Select Dashboard"
            isCollapsed={isSidebarCollapsed}
            className="!h-[3.8rem]"
            collpaseSidebar={handleSidebarCollapse}
          />
          <div className="flex-1 overflow-auto bg-white p-6">
            <div className="max-w-6xl mx-auto text-center py-12">
              <LayoutDashboardIcon className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Failed to load dashboards</h3>
              <p className="text-gray-500 mb-4">There was an error loading your dashboards. Please try again.</p>
              <Button className="bg-primary text-white" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
        <CompanyModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <Navbar
          title="Select Dashboard"
          isCollapsed={isSidebarCollapsed}
          className="!h-[3.8rem]"
          collpaseSidebar={handleSidebarCollapse}
        />
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Search and Create - Fixed at top */}
            <div className="sticky top-0 z-10 bg-white p-6 pb-4 border-gray-100">
              <div className="flex gap-4">
                <div className="flex-1 bg-white relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search dashboards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 rounded-md"
                  />
                </div>
                <Button
                  onClick={handleCreateNew}
                  className="flex bg-primary text-white items-center gap-2 h-12 rounded-md"
                >
                  <PlusIcon className="w-4 h-4" />
                  New Dashboard
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-gray-600">Loading dashboards...</span>
                  </div>
                </div>
              )}

              {/* Dashboard Grid */}
              {!isLoading && (
                <div className="space-y-4">
                  {filteredDashboards.map((dashboard) => (
                    <DashboardCard key={dashboard.id} dashboard={dashboard} onClick={handleDashboardSelect} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredDashboards.length === 0 && (
                <div className="text-center py-12">
                  <LayoutDashboardIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    {searchTerm ? 'No dashboards found' : 'No dashboards yet'}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first dashboard'}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm('')} className="mr-2 text-primary">
                      Clear Search
                    </Button>
                  )}
                  <Button className="bg-primary text-white" onClick={handleCreateNew}>
                    Create Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Dashboard Modal */}
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <CompanyModal />
    </div>
  );
}
