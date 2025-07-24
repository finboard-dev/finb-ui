'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedCompany, setCompanies, selectCompanies, setUserData } from '@/lib/store/slices/userSlice';
import { fetcher } from '@/lib/axios/config';
import { Building2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { initAddQuickBookAccount } from '@/lib/api/intuitService';
import connectToQuickbooksButton from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_default.svg';
import connectToQuickBooksHover from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_hover.svg';
import { getCurrentCompany } from '@/lib/api/allCompany';
import { useAllCompanies } from '@/hooks/query-hooks/useCompany';

const CompanySelectionPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization);
  const token = useAppSelector((state) => state.user.token);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [isAddingQuickBooks, setIsAddingQuickBooks] = useState(false);
  const companies = useAppSelector(selectCompanies);

  // React Query hook for fetching companies
  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useAllCompanies();

  // Debug auto-connecting state changes
  useEffect(() => {
    console.log('Auto-connecting state changed:', isAutoConnecting);
  }, [isAutoConnecting]);

  // Debug auto-connect conditions
  useEffect(() => {
    console.log('Auto-connect conditions check:', {
      selectedCompanyId,
      companiesLength: companies.length,
      isLoadingCompanies,
      isAutoConnecting,
      shouldAutoConnect: selectedCompanyId && companies.length === 1 && !isLoadingCompanies && !isAutoConnecting,
    });
  }, [selectedCompanyId, companies.length, isLoadingCompanies, isAutoConnecting]);

  // Update companies in Redux state when data is fetched
  useEffect(() => {
    if (companiesData && !isLoadingCompanies) {
      console.log('Companies data received:', companiesData);
      const mappedCompanies = (companiesData?.data || companiesData || []).map((company: any) => ({
        ...company,
        name: company.companyName,
        status: company.isActive ? 'ACTIVE' : 'INACTIVE',
      }));
      console.log('Mapped companies:', mappedCompanies);
      dispatch(setCompanies(mappedCompanies));

      // Auto-select if there's only one company
      if (mappedCompanies.length === 1) {
        console.log('Auto-selecting single company:', mappedCompanies[0]);
        setSelectedCompanyId(mappedCompanies[0].id);
      }
    }
  }, [companiesData, isLoadingCompanies, dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('Company selection - selectedOrganization:', selectedOrganization);
    console.log('Company selection - companies from Redux:', companies);
    console.log('Company selection - companiesData from React Query:', companiesData);
    console.log('Company selection - isLoadingCompanies:', isLoadingCompanies);
    console.log('Company selection - companiesError:', companiesError);
  }, [selectedOrganization, companies, companiesData, isLoadingCompanies, companiesError]);

  // Auto-connect when single company is auto-selected
  useEffect(() => {
    if (selectedCompanyId && companies.length === 1 && !isLoadingCompanies && !isAutoConnecting) {
      console.log('Auto-connecting single company:', selectedCompanyId);
      setIsAutoConnecting(true);

      // Add a small delay to ensure UI updates are complete
      const timer = setTimeout(async () => {
        try {
          console.log('Starting auto-connect process...');

          const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
          if (!selectedCompany) {
            throw new Error('Selected company not found');
          }

          console.log('Connecting to company:', selectedCompany.name);

          // Call the /company/current API with the selected company ID
          const response = await getCurrentCompany(selectedCompanyId);
          const companyData = response?.data || response;

          console.log('Company data received from API:', companyData);

          // The API response contains all the company data including assistants, tools, chat conversations
          // The existing ecosystem is already built to handle this data structure
          dispatch(setSelectedCompany(companyData));

          // Also update the user object to keep it in sync
          if (user) {
            const updatedUser = {
              ...user,
              selectedCompany: companyData,
            };

            dispatch(
              setUserData({
                user: updatedUser,
                selectedOrganization: selectedOrganization || undefined,
                selectedCompany: companyData,
              })
            );
          }

          document.cookie = 'has_selected_company=true; path=/';

          console.log('Successfully connected to company, redirecting to dashboard...');

          // Small delay to ensure state updates are processed
          setTimeout(() => {
            router.push('/');
          }, 100);
        } catch (error) {
          console.error('Auto-connect failed:', error);
          setError(error instanceof Error ? error.message : 'Failed to connect to company');
          setIsAutoConnecting(false);
        }
      }, 500);

      // Safety timeout to reset auto-connecting state if it gets stuck
      const safetyTimer = setTimeout(() => {
        console.warn('Auto-connect timeout, resetting state');
        setIsAutoConnecting(false);
      }, 10000); // 10 seconds timeout

      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    }
  }, [
    selectedCompanyId,
    companies.length,
    isLoadingCompanies,
    isAutoConnecting,
    companies,
    user,
    selectedOrganization,
    dispatch,
    router,
  ]);

  useEffect(() => {
    if (!token?.accessToken) {
      router.push('/login');
    }
  }, [token, router]);

  // Set organization cookie if we have a selected organization
  useEffect(() => {
    if (selectedOrganization) {
      document.cookie = 'has_selected_organization=true; path=/; SameSite=Lax; Secure';
    }
  }, [selectedOrganization]);

  // Cleanup auto-connecting state when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (isAutoConnecting) {
        console.log('Cleaning up auto-connecting state');
        setIsAutoConnecting(false);
      }
    };
  }, [isAutoConnecting]);

  // Force navigation after successful auto-connect
  useEffect(() => {
    if (isAutoConnecting && selectedCompanyId && companies.length === 1) {
      console.log('Checking if we should force navigate...');
      const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
      if (selectedCompany) {
        console.log('Force navigating to dashboard...');
        setTimeout(() => {
          router.push('/');
        }, 2000); // 2 second delay to ensure auto-connect completes
      }
    }
  }, [isAutoConnecting, selectedCompanyId, companies, router]);

  // Show loading state while user/organization data is being loaded
  if (!user || !selectedOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
          <div className="mb-8 flex items-center">
            <button onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-16 w-16 animate-spin text-gray-400" />
            <h2 className="text-2xl font-semibold">Loading organization data...</h2>
            <p className="text-gray-500">Please wait while we fetch your organization information</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCompanySelect = (companyId: string) => {
    const selectedCompany = companies.find((company) => company.id === companyId);
    if (selectedCompany) {
      setSelectedCompanyId(companyId);
    }
  };

  const handleAddQuickBooks = async () => {
    setIsAddingQuickBooks(true);
    try {
      const redirectUrl = await initAddQuickBookAccount();
      if (redirectUrl) {
        window.open(redirectUrl, '_self');
      } else {
        console.error('No redirect URL provided');
        setIsAddingQuickBooks(false);
      }
    } catch (error) {
      console.error(error);
      setIsAddingQuickBooks(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedCompanyId) {
      setError('Please select a company to continue');
      setIsAutoConnecting(false);
      return;
    }

    setError(null);

    // Only set auto-connecting if not already set (for manual connect)
    if (!isAutoConnecting) {
      setIsAutoConnecting(true);
    }

    try {
      const selectedCompany = companies.find((company) => company.id === selectedCompanyId);

      if (!selectedCompany) {
        throw new Error('Selected company not found');
      }

      console.log('Connecting to company:', selectedCompany.name);

      // Call the /company/current API with the selected company ID
      const response = await getCurrentCompany(selectedCompanyId);
      const companyData = response?.data || response;

      console.log('Company data received from API:', companyData);

      // The API response contains all the company data including assistants, tools, chat conversations
      // The existing ecosystem is already built to handle this data structure
      dispatch(setSelectedCompany(companyData));

      // Also update the user object to keep it in sync
      if (user) {
        const updatedUser = {
          ...user,
          selectedCompany: companyData,
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: selectedOrganization || undefined,
            selectedCompany: companyData,
          })
        );
      }

      document.cookie = 'has_selected_company=true; path=/';

      console.log('Successfully connected to company, redirecting...');

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      console.error('Error setting current company:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to company');
      setIsAutoConnecting(false);
    }
  };

  // Main company selection UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
        <div className="mb-14 flex justify-between">
          <div className={'space-y-4'}>
            <h2 className="text-2xl font-semibold">Select a company</h2>
            <p className="text-gray-500">Choose from connected company</p>
          </div>

          <div className=" rounded-md border max-h-fit border-gray-200 px-3 py-1.5 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-4 w-4">👤</span>
              {user.email}
            </span>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}
        {companiesError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
            Failed to load companies: {companiesError.message}
          </div>
        )}

        {!selectedOrganization?.id ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="text-gray-500">Preparing to load companies...</span>
            </div>
          </div>
        ) : isLoadingCompanies ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="text-gray-500">Loading companies...</span>
            </div>
          </div>
        ) : isAutoConnecting ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              <span className="text-green-600">
                Connecting to {selectedCompanyId ? companies.find((c) => c.id === selectedCompanyId)?.name : ''}
              </span>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No companies found</h3>
            <p className="text-gray-500 text-center mb-6">
              You don't have any companies in {selectedOrganization?.name}'s organization
            </p>
            {/* <button onClick={handleAddQuickBooks} className="relative w-[238px] h-[52px] group">
              <Image
                src={connectToQuickbooksButton}
                alt="Connect to QuickBooks"
                className="w-full group-hover:opacity-0"
                priority
              />
              <Image
                src={connectToQuickBooksHover}
                alt="Connect to QuickBooks"
                className="w-full absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                priority
              />
            </button> */}
          </div>
        ) : (
          <div className="grid grid-cols-2 max-h-80 overflow-y-auto gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`relative flex cursor-pointer items-center gap-3 rounded-md border ${
                  selectedCompanyId === company.id
                    ? 'border-[#4CAF50] ring-1 ring-[#4CAF50]'
                    : 'border-gray-200 hover:border-gray-300'
                } p-4`}
                onClick={() => handleCompanySelect(company.id)}
              >
                <Building2 className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className={`text-sm ${company.isActive ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                    {company.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                </div>
                {selectedCompanyId === company.id && (
                  <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-[#4CAF50]"></div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
          <button
            onClick={handleAddQuickBooks}
            disabled={isAddingQuickBooks}
            className="relative w-[238px] h-[52px] group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingQuickBooks ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Connecting...</span>
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={connectToQuickbooksButton}
                  alt="Connect to QuickBooks"
                  className="w-full group-hover:opacity-0"
                  priority
                />
                <Image
                  src={connectToQuickBooksHover}
                  alt="Connect to QuickBooks"
                  className="w-full absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                  priority
                />
              </>
            )}
          </button>

          <button
            onClick={handleConnect}
            disabled={!selectedCompanyId || isAutoConnecting}
            className={`rounded-md ${
              selectedCompanyId && !isAutoConnecting ? 'bg-[#212529]' : 'bg-gray-200'
            } px-6 py-2 text-sm font-medium text-white`}
          >
            {isAutoConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </div>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectionPage;
