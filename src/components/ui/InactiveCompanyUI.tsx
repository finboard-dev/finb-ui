'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/common/navbar';
import { Sidebar } from '@/components/ui/common/sidebar';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import { setCompanies, setSelectedCompany, setUserData, selectCompanies } from '@/lib/store/slices/userSlice';
import connectToQuickbooksButton from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_default.svg';
import connectToQuickBooksHover from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_hover.svg';
import Image from 'next/image';
import { initAddQuickBookAccount } from '@/lib/api/intuitService';
import { toast } from 'sonner';
import { CompanyModal } from './common/CompanyModal';
import { useAllCompanies } from '@/hooks/query-hooks/useCompany';
import { Shimmer } from '@/app/chat/components/chat/ui/shimmer/Shimmer';

interface InactiveCompanyUIProps {
  className?: string;
  title?: string;
}

const InactiveCompanyUI: React.FC<InactiveCompanyUIProps> = ({ className = '', title = 'Session Expired' }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  // Get user data from Redux
  const user = useAppSelector((state) => state.user.user);
  const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization);
  const companies = useAppSelector(selectCompanies);

  // Fetch companies using React Query
  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useAllCompanies();

  // Handle initial load state
  useEffect(() => {
    if (!isLoadingCompanies) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100); // Small delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [isLoadingCompanies]);

  // Update Redux state when companies data is fetched
  useEffect(() => {
    if (companiesData && !isLoadingCompanies) {
      const mappedCompanies = (companiesData?.data || companiesData || []).map((company: any) => ({
        ...company,
        name: company.companyName,
        status: company.isActive ? 'ACTIVE' : 'INACTIVE',
      }));
      dispatch(setCompanies(mappedCompanies));
    }
  }, [companiesData, isLoadingCompanies, dispatch]);

  // Show shimmer while loading or during initial load
  if (isLoadingCompanies || isInitialLoad) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <Navbar
            className="!h-[3.8rem] !px-4 !shadow-none"
            title={title}
            collpaseSidebar={() => dispatch(toggleComponent({ id: 'sidebar-chat' }))}
            isCollapsed={isSidebarCollapsed}
          />

          {/* Loading Content - Center loading state */}
          <div className={`flex-1 flex items-center justify-center ${className}`}>
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                {/* Loading icon shimmer */}
                <div className="mx-auto mb-4 w-8 h-8">
                  <Shimmer className="w-full h-full rounded-full" />
                </div>

                {/* Title shimmer */}
                <div className="mb-2">
                  <Shimmer className="h-6 w-48 mx-auto" />
                </div>

                {/* Description shimmer */}
                <div className="mb-6">
                  <Shimmer className="h-4 w-64 mx-auto" />
                </div>

                {/* Button shimmer */}
                <div className="flex justify-center">
                  <Shimmer className="h-10 w-48" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if companies fetch failed and not in initial load
  if (companiesError && !isInitialLoad) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <Navbar
            className="!h-[3.8rem] !px-4 !shadow-none"
            title={title}
            collpaseSidebar={() => dispatch(toggleComponent({ id: 'sidebar-chat' }))}
            isCollapsed={isSidebarCollapsed}
          />

          {/* Error Content */}
          <div className={`flex-1 flex items-center justify-center ${className}`}>
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
                <h2 className="text-xl font-semibold mb-2 text-gray-900">Error Loading Companies</h2>
                <p className="text-gray-600 mb-4">Failed to load company data. Please try again.</p>
                <Button onClick={() => refetchCompanies()} className="bg-gray-900 text-white hover:bg-gray-800">
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleConnectToCompany = async () => {
    try {
      setIsConnecting(true);
      console.log('Starting QuickBooks connection...');

      const redirectUrl = await initAddQuickBookAccount();
      console.log('QuickBooks connection result:', redirectUrl);

      if (redirectUrl) {
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.error('No redirect URL provided');
        toast.error('Failed to get QuickBooks connection URL');
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      toast.error('Failed to connect to QuickBooks');
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleSidebar = () => {
    dispatch(toggleComponent({ id: 'sidebar-chat' }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          className="!h-[3.8rem] !px-4 !shadow-none"
          title={title}
          collpaseSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Inactive Company Content */}
        <div className={`flex-1 flex items-center justify-center ${className}`}>
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Session Expired!</h2>
              <p className="text-gray-600 mb-4">Please reconnect your company to resume.</p>
              <div className="flex justify-center">
                <button
                  onClick={handleConnectToCompany}
                  disabled={isConnecting}
                  className="relative w-[200px] h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-600 rounded text-white text-sm font-medium">
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <Image
                        src={connectToQuickbooksButton}
                        alt="Connect to QuickBooks"
                        className="absolute inset-0 cursor-pointer"
                        priority
                      />
                      <Image
                        src={connectToQuickBooksHover}
                        alt="Connect to QuickBooks"
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        priority
                      />
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CompanyModal />
    </div>
  );
};

export default InactiveCompanyUI;
