import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ChevronsUpDown,
  Building,
  // Users,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  selectUser,
  selectSelectedOrganization,
  selectSelectedCompany,
  setSelectedOrganization,
  setSelectedCompany,
  setUserData,
  type Organization,
  type Company,
  type UserOrganization,
} from '@/lib/store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { initializeComponent, selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import { useSearchParams, useRouter } from 'next/navigation';
import { toggleSidebar } from '@/lib/store/slices/chatSlice';
import { setDropDownLoading, selectDropDownLoading } from '@/lib/store/slices/loadingSlice';
import { initAddQuickBookAccount } from '@/lib/api/intuitService';
import { fetcher } from '@/lib/axios/config';
import { getCurrentCompany, getAllCompany } from '@/lib/api/allCompany';
import connectToQuickBooksMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_default.svg';
import connectToQuickBooksHoverMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_hover.svg';
import Image from 'next/image';
import { useUrlParams } from '@/lib/utils/urlParams';
import { addConnection } from '@/lib/api/settings';

interface OrganizationDropdownProps {
  onCompanyChange?: () => void;
  onOrganizationChange?: () => void;
}

enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  onCompanyChange,
  onOrganizationChange,
}) => {
  const [error, setError] = useState<any>(null);
  const [showOrganizations, setShowOrganizations] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isParamSet, toggleComponentState } = useUrlParams();
  const componentId = 'dropdown-organization';

  const user = useSelector(selectUser);
  const selectedOrganization = useSelector(selectSelectedOrganization);
  const selectedCompany = useSelector(selectSelectedCompany);
  const [quickBooksImgSrc, setQuickBooksImgSrc] = useState(connectToQuickBooksMed);

  const companies = useAppSelector((state) => state.user.companies);

  // Get dropdown state from URL parameters (source of truth)
  const isOpen = isParamSet(componentId, 'open');

  // Sync URL parameters to Redux state
  useEffect(() => {
    dispatch(
      initializeComponent({
        type: 'dropdown',
        id: componentId,
        isOpenFromUrl: isOpen,
      })
    );
  }, [dispatch, componentId, isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    toggleComponentState(componentId, newState);
    if (!newState) {
      setShowOrganizations(false);
    }
  };

  const handleAddQuickBooks = async () => {
    try {
      const redirectUrl = await addConnection();
      if (redirectUrl.redirectUrl) {
        window.open(redirectUrl.redirectUrl, '_self');
      } else {
        console.error('No redirect URL provided');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle organization selection
  const handleOrganizationSelect = async (userOrg: UserOrganization) => {
    setError(null);
    dispatch(setDropDownLoading(true));

    try {
      // Create the organization object in the expected format
      const organizationToSelect: Organization = {
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        status: userOrg.organization.status,
        enabledFeatures: userOrg.organization.enabledFeatures || [],
        billingEmail: userOrg.organization.billingEmail,
        contactEmail: userOrg.organization.contactEmail,
        companies: [], // Will be populated when companies are loaded
        role: {
          id: userOrg.role.id,
          name: userOrg.role.name,
          permissions: [], // You might need to fetch permissions separately
        },
      };

      // Update the selected organization
      dispatch(setSelectedOrganization(organizationToSelect));

      // Update the user's role to match the selected organization's role
      if (user) {
        const updatedUser = {
          ...user,
          role: {
            id: userOrg.role.id,
            key: userOrg.role.key,
            name: userOrg.role.name,
            permissions: [], // You might need to fetch permissions separately
          },
          selectedOrganization: organizationToSelect,
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: organizationToSelect,
          })
        );
      }

      // After switching organization, we need to update the selected company
      // to the first available company in the new organization
      try {
        // Get all companies for the new organization
        const companiesResponse = await getAllCompany();
        const allCompanies = companiesResponse?.data || companiesResponse || [];

        // Find the first active company in the new organization
        const firstActiveCompany = allCompanies.find(
          (company: any) => company.status === CompanyStatus.ACTIVE && !company.isMultiEntity
        );

        if (firstActiveCompany) {
          // Get the full company data including chat conversations
          const companyResponse = await getCurrentCompany(firstActiveCompany.id);
          const selectedCompanyData = companyResponse?.data || companyResponse;

          // Update the top-level selectedCompany
          dispatch(setSelectedCompany(selectedCompanyData));

          // Also update the user object to keep it in sync
          if (user) {
            dispatch(
              setUserData({
                user: user,
                selectedOrganization: organizationToSelect,
                selectedCompany: selectedCompanyData,
              })
            );
          }

          document.cookie = 'has_selected_company=true; path=/';
        }
      } catch (companyError) {
        console.error('Error updating company after organization switch:', companyError);
        // Don't throw here, as the organization switch was successful
      }

      // Close dropdown and reset view
      dispatch(toggleComponent({ id: componentId, forceState: false }));
      toggleComponentState(componentId, false);
      setShowOrganizations(false);

      if (onOrganizationChange) onOrganizationChange();
    } catch (err: any) {
      console.error('Error setting organization:', err);
      setError(err.message || 'Error setting organization');
    } finally {
      dispatch(setDropDownLoading(false));
    }
  };

  // Get organizations from the nested structure
  const organizations: UserOrganization[] = user?.organizations || [];

  const handleCompanySelect = async (org: Organization, company: Company) => {
    setError(null);

    // Set loading state to true
    dispatch(setDropDownLoading(true));

    try {
      const response = await getCurrentCompany(company.id);
      const selectedCompanyData = response?.data || response;

      // Update the top-level selectedCompany
      dispatch(setSelectedCompany(selectedCompanyData));

      // Also update the user object to keep it in sync
      if (user) {
        dispatch(
          setUserData({
            user: user,
            selectedOrganization: selectedOrganization || undefined,
            selectedCompany: selectedCompanyData,
          })
        );
      }

      document.cookie = 'has_selected_company=true; path=/';
      dispatch(toggleComponent({ id: componentId, forceState: false }));
      toggleComponentState(componentId, false);
      setShowOrganizations(false);
      if (onCompanyChange) onCompanyChange();
    } catch (err: any) {
      console.error('Error setting current company:', err);
      setError(err.message || 'Error setting current company');
      dispatch(setSelectedCompany(null as any));
    } finally {
      dispatch(setDropDownLoading(false));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        dispatch(toggleComponent({ id: componentId, forceState: false }));
        toggleComponentState(componentId, false);
        setShowOrganizations(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch, searchParams, router]);

  if (!selectedOrganization || !user) return null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="flex w-full hover:cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-gray-50 focus:outline-none transition-all duration-200"
        onClick={handleToggle}
        id="dropdown-organization-button"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary to-primary/80 text-white shadow-inner">
            <span className="text-xs font-semibold">
              {selectedCompany?.name?.substring(0, 2).toUpperCase() || 'SC'}
            </span>
            <div
              className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white
              ${selectedCompany?.status === CompanyStatus.ACTIVE ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {selectedCompany?.name || 'Select Company'}
            </span>
            <span className="text-xs text-gray-500 line-clamp-1">{selectedOrganization?.name}</span>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white animate-in fade-in-0 zoom-in-95 duration-100">
          {!showOrganizations ? (
            // Show current organization's companies
            <>
              {/* Organization header with switch option */}
              <div className="border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2">
                    {/* <Users className="h-3.5 w-3.5 text-primary" /> */}
                    <span className="text-xs font-medium text-gray-700">{selectedOrganization?.name}</span>
                  </div>
                  {organizations.length > 1 && (
                    <button
                      onClick={() => setShowOrganizations(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Switch
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Companies list */}
              {companies && companies.length > 0 ? (
                <div className="max-h-64 overflow-y-auto py-1">
                  {companies.map((company) => {
                    const isActive = company.status === CompanyStatus.ACTIVE && !company.isMultiEntity;
                    const isSelected = company.id === selectedCompany?.id;
                    return (
                      <div
                        key={company.id}
                        className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
                          isSelected ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                        } ${!isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (isActive) {
                            handleCompanySelect(selectedOrganization, company);
                          }
                        }}
                        id={`click-company-${company.id}`}
                        title={
                          !isActive
                            ? company.isMultiEntity
                              ? 'Multi-entity companies cannot be selected'
                              : `This company is ${company.status}`
                            : ''
                        }
                      >
                        {/* <div
                          className={`relative flex h-6 w-6 items-center justify-center rounded-md ${
                            isSelected
                              ? "bg-primary/20 text-primary"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {company.name.substring(0, 2).toUpperCase()}
                          </span>
                          <div
                            className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white ${
                              company.status === CompanyStatus.ACTIVE
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                        </div> */}
                        <div className="flex flex-grow items-center">
                          <span className="text-sm">{company.name}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">No companies available</div>
              )}
            </>
          ) : (
            // Show organizations list
            <>
              {/* Back button */}
              <div className="border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between p-2.5">
                  <button
                    onClick={() => setShowOrganizations(false)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Back
                  </button>
                  <span className="text-xs font-medium text-gray-700">Switch Organization</span>
                </div>
              </div>

              {/* Organizations list */}
              <div className="max-h-64 overflow-y-auto py-1">
                {organizations.map((org) => {
                  const isSelected = org.organization.id === selectedOrganization?.id;
                  return (
                    <div
                      key={org.organization.id}
                      className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOrganizationSelect(org)}
                      id={`click-organization-${org.organization.id}`}
                    >
                      {/* <div
                        className={`relative flex h-6 w-6 items-center justify-center rounded-md ${
                          isSelected
                            ? "bg-primary/20 text-primary"
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                      </div> */}
                      <div className="flex flex-grow flex-col">
                        <span className="text-sm font-medium">{org.organization.name}</span>
                        <span className="text-xs text-gray-500">{org.role.name}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* QuickBooks connection button */}
          <div className="border-t border-gray-100 p-2 flex justify-center items-center bg-gray-50">
            <Image
              onClick={() => {
                dispatch(toggleComponent({ id: componentId, forceState: false }));
                toggleComponentState(componentId, false);
                setShowOrganizations(false);
                handleAddQuickBooks();
              }}
              className="cursor-pointer"
              src={connectToQuickBooksMed || '/placeholder.svg'}
              alt="Connect to QuickBooks"
              onMouseEnter={(e) => {
                const img = e.currentTarget;
                img.src = connectToQuickBooksHoverMed.src;
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget;
                img.src = connectToQuickBooksMed.src;
              }}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 p-2">
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CollapsedOrganizationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const isLoading = useAppSelector(selectDropDownLoading);

  const handleClick = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className="w-full flex justify-center px-2 py-2">
      <button
        type="button"
        id="collapsed-organization-button"
        className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
        ) : selectedCompany ? (
          <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white">
            <span className="text-xs text-white font-semibold">
              {selectedCompany && selectedCompany.name ? selectedCompany.name.substring(0, 1).toUpperCase() : 'SC'}
            </span>
            <div
              className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white
                ${selectedCompany.status === CompanyStatus.ACTIVE ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
          </div>
        ) : (
          <Building className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};
