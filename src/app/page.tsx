'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useClickEventTracking } from '@/hooks/useClickTracking';
import { useInactiveCompany } from '@/hooks/useInactiveCompany';
import { useCompanyData } from '@/hooks/query-hooks/useCompany';
import { useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import {
  selectHasConsolidationFeature,
  selectHasReportingFeature,
  selectHasDashboardFeature,
  selectHasChatFeature,
  selectHasComponentsFeature,
} from '@/lib/store/slices/userSlice';
import QuickbooksIcon from '@/../public/home/quickbooks.svg';
import chatIcon from '@/../public/images/icons/sidebarIcons/chat.svg';
import dashboardIcon from '@/../public/images/icons/sidebarIcons/dashboard.svg';
import ReportsIcon from '@/../public/images/icons/sidebarIcons/reports.svg';
import consolidationIcon from '@/../public/images/icons/sidebarIcons/consolidation.svg';
import componentsIcon from '@/../public/images/icons/sidebarIcons/components.svg';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Sidebar } from '@/components/ui/common/sidebar';
import { CompanyModal } from '@/components/ui/common/CompanyModal';
import connectToQuickbooksButton from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_default.svg';
import connectToQuickBooksHover from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_hover.svg';
import { initAddQuickBookAccount } from '@/lib/api/intuitService';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import GoogleSheetsPopup from '@/components/ui/templates/GoogleSheetsPopup';
import { store } from '@/lib/store/store';
import { FeatureIds, FeatureDisplayNames, FeatureDescriptions, FeatureRoutes } from '@/constants/features';
import { setPluginInstalledFalse } from '@/lib/store/slices/userSlice';

const stepItems = [
  {
    id: FeatureIds.FINB_AGENT,
    label: FeatureDisplayNames[FeatureIds.FINB_AGENT],
    description: FeatureDescriptions[FeatureIds.FINB_AGENT],
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={chatIcon} alt="Chat" width={16} height={16} />
      </div>
    ),
    href: FeatureRoutes[FeatureIds.FINB_AGENT],
    stepNumber: 1,
  },
  {
    id: FeatureIds.DASHBOARD,
    label: FeatureDisplayNames[FeatureIds.DASHBOARD],
    description: FeatureDescriptions[FeatureIds.DASHBOARD],
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={dashboardIcon} alt="Dashboard" width={16} height={16} />
      </div>
    ),
    href: FeatureRoutes[FeatureIds.DASHBOARD],
    stepNumber: 2,
  },
  {
    id: FeatureIds.COMPONENTS,
    label: FeatureDisplayNames[FeatureIds.COMPONENTS],
    description: FeatureDescriptions[FeatureIds.COMPONENTS],
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={componentsIcon} alt="Components" width={16} height={16} />
      </div>
    ),
    href: FeatureRoutes[FeatureIds.COMPONENTS],
    stepNumber: 3,
  },
  {
    id: FeatureIds.REPORTING,
    label: FeatureDisplayNames[FeatureIds.REPORTING],
    description: FeatureDescriptions[FeatureIds.REPORTING],
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={ReportsIcon} alt="Reports" width={16} height={16} />
      </div>
    ),
    href: FeatureRoutes[FeatureIds.REPORTING],
    stepNumber: 4,
  },
  {
    id: FeatureIds.CONSOLIDATION,
    label: FeatureDisplayNames[FeatureIds.CONSOLIDATION],
    description: FeatureDescriptions[FeatureIds.CONSOLIDATION],
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={consolidationIcon} alt="Consolidation" width={24} height={24} />
      </div>
    ),
    href: FeatureRoutes[FeatureIds.CONSOLIDATION],
    stepNumber: 5,
  },
];

// Custom Inactive Company UI for home route (with sidebar but no navbar)
const HomeInactiveCompanyUI = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  // Initialize sidebar component if it doesn't exist
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content without navbar */}
        <div className="flex-1 flex items-center justify-center">
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

const Page = () => {
  const router = useRouter();
  const isGoogleSheetsInstalled = store.getState().user?.pluginInstalled || false;
  const [isPopupOpen, setIsPopupOpen] = useState(!isGoogleSheetsInstalled);

  useClickEventTracking();

  const selectedCompanyId = useSelector((state: any) => state.user.selectedCompany?.id);

  // Get feature flags from Redux
  const hasConsolidationFeature = useSelector(selectHasConsolidationFeature);
  const hasReportingFeature = useSelector(selectHasReportingFeature);
  const hasDashboardFeature = useSelector(selectHasDashboardFeature);
  const hasChatFeature = useSelector(selectHasChatFeature);
  const hasComponentsFeature = useSelector(selectHasComponentsFeature);

  // Fetch company data
  const { isLoading: isCompanyDataLoading } = useCompanyData(selectedCompanyId);

  // Check if company is inactive
  const { isCompanyInactive } = useInactiveCompany();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // Show loading shimmer while determining company status
  if (isCompanyDataLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto bg-white p-6">
            <div className="max-w-5xl z-50 mx-auto">
              <div className="max-w-4xl mx-auto px-12">
                {/* Loading shimmer for welcome section */}
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-4 mx-auto max-w-md"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto max-w-2xl"></div>
                </div>

                {/* Loading shimmer for step cards */}
                <div className="space-y-4 h-[calc(100vh-300px)] z-50 overflow-y-auto scroll-hidden">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // If company is inactive, show the custom inactive company UI with sidebar but no navbar
  if (isCompanyInactive) {
    return <HomeInactiveCompanyUI />;
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto bg-white p-6">
          <div className="max-w-5xl z-50 mx-auto">
            <div className="max-w-4xl mx-auto px-12">
              {/* Logo and Welcome Section */}
              <div className="text-center mb-12">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  {/* <div className="w-16 h-12 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">F</span>
                  </div> */}
                </div>

                {/* Welcome Title */}
                <h1 className="text-[2.13rem] font-bold text-gray-900 mb-4">Welcome to FinB</h1>
                <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                  Connect your data, generate insights with AI, and <br /> build custom financial dashboards
                </p>
              </div>

              {/* Step Cards */}
              <div className="space-y-4 h-[calc(100vh-300px)] z-50 overflow-y-auto scroll-hidden">
                {stepItems
                  .filter((item) => {
                    // Filter based on feature flags - show items when feature is enabled
                    if (item.id === FeatureIds.FINB_AGENT && !hasChatFeature) {
                      return false;
                    }
                    if (item.id === FeatureIds.DASHBOARD && !hasDashboardFeature) {
                      return false;
                    }
                    if (item.id === FeatureIds.COMPONENTS && !hasComponentsFeature) {
                      return false;
                    }
                    if (item.id === FeatureIds.REPORTING && !hasReportingFeature) {
                      return false;
                    }
                    if (item.id === FeatureIds.CONSOLIDATION && !hasConsolidationFeature) {
                      return false;
                    }
                    return true;
                  })
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-6 flex items-center justify-between cursor-pointer"
                      onClick={() => handleNavigation(item.href)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center">{item.icon}</div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{item.label}</h3>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* <Button
                        variant="outline"
                        className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation(item.href);
                        }}
                      >
                        Connect
                      </Button> */}
                        <span className="text-6xl font-light text-gray-200">{index + 1}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Google Sheets Popup */}
      <GoogleSheetsPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  );
};

export default Page;
