'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedCompany, setCompanies, setUserData, clearCompanies } from '@/lib/store/slices/userSlice';
import { fetcher } from '@/lib/axios/config';
import { Building2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { initAddQuickBookAccount } from '@/lib/api/intuitService';
import connectToQuickbooksButton from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_default.svg';
import connectToQuickBooksHover from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_hover.svg';
import { getCurrentCompany, getAllCompany } from '@/lib/api/allCompany';
import { useAllCompanies, useCurrentCompany } from '@/hooks/query-hooks/useCompany';
import { store } from '@/lib/store/store';
import { useQueryClient } from '@tanstack/react-query';

const CompanySelectionPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.user.user);
  const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization);
  const token = useAppSelector((state) => state.user.token);
  const reduxCompanies = useAppSelector((state) => state.user.companies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [isAddingQuickBooks, setIsAddingQuickBooks] = useState(false);
  const selectedCompany = useAppSelector((state) => state.user.selectedCompany);

  // Check if Redux Persist has rehydrated
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (state.user && !isRehydrated) {
        setIsRehydrated(true);
      }
    });

    return unsubscribe;
  }, [isRehydrated]);

  // React Query hook for fetching companies
  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useAllCompanies();

  // Helper function to safely extract companies from API response
  const getCompaniesFromResponse = (data: any) => {
    if (!data) return [];

    // Handle different possible API response structures
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.companies && Array.isArray(data.companies)) return data.companies;

    return [];
  };

  // Clear companies and refetch when organization changes to ensure fresh data
  useEffect(() => {
    if (selectedOrganization?.id && isRehydrated) {
      // Clear existing companies first to prevent mixing with different organizations
      dispatch(clearCompanies());

      // Invalidate the cache first
      queryClient.invalidateQueries({ queryKey: ['companies', 'all'] });
      // Then refetch
      refetchCompanies();
    }
  }, [selectedOrganization?.id, isRehydrated, refetchCompanies, queryClient, dispatch]);

  // Get companies from API data
  const companies = getCompaniesFromResponse(companiesData);

  // Update companies in Redux state when data is fetched
  useEffect(() => {
    if (companiesData && !isLoadingCompanies) {
      // Clear existing companies and populate with fresh API data
      const mappedCompanies = companies.map((company: any) => ({
        ...company,
        name: company.companyName,
        status: company.isActive ? 'ACTIVE' : 'INACTIVE',
      }));

      console.log('Updating Redux companies with fresh API data:', {
        companiesCount: mappedCompanies.length,
        companies: mappedCompanies.map((c: any) => ({ id: c.id, name: c.name })),
      });

      dispatch(setCompanies(mappedCompanies));
    }
  }, [companiesData, isLoadingCompanies, dispatch, companies]);

  // Check if already connected to prevent unnecessary auto-connection
  const hasSingleCompany = companies.length === 1;
  const isAlreadyConnected = selectedCompany && hasSingleCompany && selectedCompany.id === companies[0].id;

  // Auto-connect when single company is auto-selected
  useEffect(() => {
    const hasSingleCompany = companies.length === 1;

    // If already connected, redirect to home
    if (isAlreadyConnected) {
      setIsAutoConnecting(false);
      router.push('/');
      return;
    }

    // Only proceed if we have a single company and all conditions are met
    if (hasSingleCompany && !isLoadingCompanies && !isAutoConnecting && isRehydrated && selectedOrganization?.id) {
      const singleCompany = companies[0];

      // Set selectedCompanyId if not already set
      if (!selectedCompanyId) {
        console.log('Auto-selecting company:', singleCompany.companyName);
        setSelectedCompanyId(singleCompany.id);
        return; // Exit and wait for next effect run
      }

      // Only proceed if selectedCompanyId matches the single company
      if (selectedCompanyId === singleCompany.id) {
        console.log('Starting auto-connection for:', singleCompany.companyName);
        setIsAutoConnecting(true);

        // Call getCurrentCompany immediately
        const connectToCompany = async () => {
          try {
            console.log('Calling getCurrentCompany for:', selectedCompanyId);
            const response = await getCurrentCompany(selectedCompanyId!);
            const companyData = response?.data || response;

            const mappedCompanyData = {
              ...companyData,
              name: companyData.companyName || companyData.name,
              status: companyData.isActive ? 'ACTIVE' : 'INACTIVE',
            };

            dispatch(setSelectedCompany(mappedCompanyData));

            // Ensure companies array is populated with fresh data
            if (companies.length > 0) {
              const mappedCompanies = companies.map((company: any) => ({
                ...company,
                name: company.companyName,
                status: company.isActive ? 'ACTIVE' : 'INACTIVE',
              }));
              console.log('Auto-connect: Updating companies array with', mappedCompanies.length, 'companies');
              dispatch(setCompanies(mappedCompanies));
            }

            if (user) {
              const updatedUser = {
                ...user,
                selectedCompany: mappedCompanyData,
              };

              dispatch(
                setUserData({
                  user: updatedUser,
                  selectedOrganization: selectedOrganization || undefined,
                  selectedCompany: mappedCompanyData,
                })
              );
            }

            document.cookie = 'has_selected_company=true; path=/';

            // Verify that the store was updated before redirecting
            setTimeout(() => {
              const currentState = store.getState();
              const storeSelectedCompany = currentState.user.selectedCompany;

              if (storeSelectedCompany && storeSelectedCompany.id === selectedCompanyId) {
                console.log('Successfully connected, redirecting to /');
                setIsAutoConnecting(false);
                router.push('/');
              } else {
                console.log('Retrying dispatch and redirecting');
                dispatch(setSelectedCompany(mappedCompanyData));
                setTimeout(() => {
                  setIsAutoConnecting(false);
                  router.push('/');
                }, 200);
              }
            }, 200);
          } catch (error) {
            console.error('Error in auto-connect:', error);
            setError(error instanceof Error ? error.message : 'Failed to connect to company');
            setIsAutoConnecting(false);
          }
        };

        // Start the connection process
        connectToCompany();

        // Safety timeout to reset auto-connecting state if it gets stuck
        const safetyTimer = setTimeout(() => {
          console.log('Auto-connect safety timeout reached');
          setIsAutoConnecting(false);
        }, 10000); // 10 seconds timeout

        return () => {
          clearTimeout(safetyTimer);
        };
      }
    }
  }, [
    selectedCompanyId,
    companies,
    isLoadingCompanies,
    isAutoConnecting,
    isRehydrated,
    selectedOrganization,
    dispatch,
    router,
    user,
    selectedCompany,
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
        setIsAutoConnecting(false);
      }
    };
  }, [isAutoConnecting]);

  // Remove the force navigation effect - we only navigate after successful getCurrentCompany

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
    const selectedCompany = companies.find((company: any) => company.id === companyId);
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
      const selectedCompany = companies.find((company: any) => company.id === selectedCompanyId);

      if (!selectedCompany) {
        throw new Error('Selected company not found');
      }

      // Call the /company/current API with the selected company ID
      const response = await getCurrentCompany(selectedCompanyId!);
      const companyData = response?.data || response;

      // Ensure the company data structure matches the expected interface
      const mappedCompanyData = {
        ...companyData,
        name: companyData.companyName || companyData.name,
        status: companyData.isActive ? 'ACTIVE' : 'INACTIVE',
      };

      // The API response contains all the company data including assistants, tools, chat conversations
      // The existing ecosystem is already built to handle this data structure
      dispatch(setSelectedCompany(mappedCompanyData));

      // Ensure companies array is populated with fresh data
      if (companies.length > 0) {
        const mappedCompanies = companies.map((company: any) => ({
          ...company,
          name: company.companyName,
          status: company.isActive ? 'ACTIVE' : 'INACTIVE',
        }));
        console.log('Manual connect: Updating companies array with', mappedCompanies.length, 'companies');
        dispatch(setCompanies(mappedCompanies));
      }

      // Also update the user object to keep it in sync
      if (user) {
        const updatedUser = {
          ...user,
          selectedCompany: mappedCompanyData,
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: selectedOrganization || undefined,
            selectedCompany: mappedCompanyData,
          })
        );
      }

      document.cookie = 'has_selected_company=true; path=/';

      // Verify that the store was updated before redirecting
      setTimeout(() => {
        const currentState = store.getState();
        const storeSelectedCompany = currentState.user.selectedCompany;

        if (storeSelectedCompany && storeSelectedCompany.id === selectedCompanyId) {
          router.push('/');
        } else {
          // Retry the dispatch
          dispatch(setSelectedCompany(mappedCompanyData));
          setTimeout(() => router.push('/'), 200);
        }
      }, 200);
    } catch (err) {
      console.error('Error setting current company:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to company');
      setIsAutoConnecting(false);
    }
  };

  // Auto-select if there's only one company
  useEffect(() => {
    if (companies.length === 1 && !selectedCompanyId && !isLoadingCompanies) {
      console.log('Auto-selecting single company:', companies[0].companyName);
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId, isLoadingCompanies]);

  // Debug logging
  console.log('Render state:', {
    selectedCompanyId,
    isAutoConnecting,
    companies: companies.map((c: any) => ({ id: c.id, name: c.companyName })),
    reduxCompanies: reduxCompanies.map((c: any) => ({ id: c.id, name: c.name })),
    isLoadingCompanies,
    selectedOrganization: selectedOrganization?.id,
  });

  // Main company selection UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
        <div className="mb-8 flex items-center">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
        </div>

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
        ) : isAutoConnecting && selectedCompanyId && companies.length === 1 && selectedCompanyId === companies[0].id ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              <span className="text-green-600">
                Connecting to{' '}
                {(() => {
                  const company = companies.find((c: any) => c.id === selectedCompanyId);
                  return company?.companyName || company?.name || '';
                })()}
              </span>
            </div>
          </div>
        ) : companiesError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-md bg-red-50 p-4 text-center">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to load companies</h3>
              <p className="text-red-600 text-sm mb-4">
                {companiesError.message || 'Unable to fetch companies from the server'}
              </p>
              <button
                onClick={() => refetchCompanies()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !companiesData || companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No companies found</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              {selectedOrganization?.name
                ? `You don't have any companies in ${selectedOrganization.name}'s organization`
                : 'No companies are available for your organization'}
            </p>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">To get started, connect your first QuickBooks company</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 max-h-80 overflow-y-auto gap-4">
            {companies.map((company: any) => (
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
                  <p className="font-medium">{company.companyName || company.name}</p>
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
