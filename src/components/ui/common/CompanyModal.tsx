import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Building, Check, Loader2, Plus, Trash2, X, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  selectUser,
  selectSelectedOrganization,
  selectSelectedCompany,
  setSelectedOrganization,
  setSelectedCompany,
  setUserData,
  setCompanies,
  type Organization,
  type Company,
  type UserOrganization,
} from '@/lib/store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { initializeComponent, toggleComponent } from '@/lib/store/slices/uiSlice';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { setDropDownLoading, selectDropDownLoading } from '@/lib/store/slices/loadingSlice';
import { getCurrentCompany, getAllCompany } from '@/lib/api/allCompany';
import { useUrlParams } from '@/lib/utils/urlParams';
import { addConnection, disconnectConnection } from '@/lib/api/settings';
import { useCreateMultiEntity, useDeleteMultiEntity } from '@/hooks/query-hooks/useMultiEntity';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// QuickBooks button imports - organized at the top
import connectToQuickBooksMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_default.svg';
import connectToQuickBooksHoverMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_hover.svg';
import connectToQuickBooksSmall from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_default.svg';
import connectToQuickBooksHoverSmall from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_hover.svg';
import Image from 'next/image';

interface OrganizationModalProps {
  onCompanyChange?: () => void;
  onOrganizationChange?: () => void;
}

enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

interface CreateMultiEntityForm {
  company_name: string;
  is_active: boolean;
  currency: string;
  financial_year_start: string;
  sub_entities: string[];
}

type ModalPage = 'main' | 'organizations' | 'create-multi-entity';

export const CompanyModal: React.FC<OrganizationModalProps> = ({ onCompanyChange, onOrganizationChange }) => {
  const [error, setError] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<ModalPage>('main');
  const [createForm, setCreateForm] = useState<CreateMultiEntityForm>({
    company_name: '',
    is_active: true,
    currency: 'USD',
    financial_year_start: 'JANUARY',
    sub_entities: [],
  });
  const { isParamSet } = useUrlParams();
  const [selectedSubEntities, setSelectedSubEntities] = useState<string[]>([]);
  const [selectAllSubEntities, setSelectAllSubEntities] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingCompanyId, setDisconnectingCompanyId] = useState<string | null>(null);
  const [showQuickBooksPopup, setShowQuickBooksPopup] = useState(false);
  const [connectPopupCompanyId, setConnectPopupCompanyId] = useState<string | null>(null);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHashParamSet, toggleComponentState } = useUrlParams();
  const componentId = 'company-selection';

  const user = useSelector(selectUser);
  const selectedOrganization = useSelector(selectSelectedOrganization);
  const selectedCompany = useSelector(selectSelectedCompany);
  const companies = useAppSelector((state) => state.user.companies);
  const isLoading = useAppSelector(selectDropDownLoading);
  const isSidebarOpen = isParamSet('sidebar-chat', 'open');
  const isConsolidationRoute = usePathname().includes('consolidation');

  // Also check Redux state for modal status
  const modalState = useAppSelector((state) => state.ui.components[componentId]);

  // Multi-entity mutations
  const createMultiEntityMutation = useCreateMultiEntity();
  const deleteMultiEntityMutation = useDeleteMultiEntity();

  // Get modal state from URL hash parameters (source of truth) and Redux state
  const isOpenFromHash = isHashParamSet(componentId, 'open');
  const isOpenFromRedux = modalState?.isOpen || false;
  const isOpen = isOpenFromHash || isOpenFromRedux;

  // Debug logging
  console.log(
    'CompanyModal render - isOpenFromHash:',
    isOpenFromHash,
    'isOpenFromRedux:',
    isOpenFromRedux,
    'isOpen:',
    isOpen,
    'componentId:',
    componentId
  );

  // Sync URL hash parameters to Redux state
  useEffect(() => {
    console.log('CompanyModal useEffect - syncing to Redux, isOpen:', isOpen);
    dispatch(
      initializeComponent({
        type: 'modal',
        id: componentId,
        isOpenFromUrl: isOpen,
      })
    );
  }, [dispatch, componentId, isOpen]);

  // Handle modal close - update URL hash
  const handleClose = () => {
    toggleComponentState(componentId, false);
    setCurrentPage('main');
    setError(null);
  };

  // Add this useEffect near the top of the component, after defining isOpen and dispatch
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const companiesResponse = await getAllCompany();
        const mappedCompanies = (companiesResponse?.data || companiesResponse || []).map((company: any) => ({
          ...company,
          name: company.companyName || company.name,
          status: company.isActive ? 'ACTIVE' : 'INACTIVE',
        }));
        dispatch(setCompanies(mappedCompanies));
      })();
    }
  }, [isOpen, dispatch]);

  // Filter companies by type
  const normalCompanies = companies.filter((company) => !company.isMultiEntity);
  const multiEntityCompanies = companies.filter((company) => company.isMultiEntity);

  // Get active companies for sub-entities selection
  const activeCompanies = normalCompanies.filter((company) => company.status === CompanyStatus.ACTIVE);

  // Get all non-multi-entity companies for sub-entities selection
  const allNonMultiEntityCompanies = normalCompanies;

  // Add refs for popups
  const newCompanyPopupRef = useRef<HTMLDivElement>(null);
  const connectPopupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Utility function to calculate popup position
  const getPopupPosition = (containerRef: React.RefObject<HTMLDivElement>) => {
    if (!containerRef.current) return { left: 0, top: '100%' };

    const rect = containerRef.current.getBoundingClientRect();
    const modalRect = document.querySelector('[role="dialog"]')?.getBoundingClientRect();

    if (!modalRect) return { left: 0, top: '100%' };

    // Check if popup would go outside modal bounds
    const popupWidth = 120;
    const popupHeight = 40;

    let left = 0;
    let top = '100%';

    // Adjust horizontal position if it would overflow
    if (rect.right + popupWidth > modalRect.right) {
      left = -(popupWidth - rect.width);
    }

    // Adjust vertical position if it would overflow
    if (rect.bottom + popupHeight > modalRect.bottom) {
      top = 'auto';
      return { left, bottom: '100%' };
    }

    return { left, top };
  };

  // QuickBooks Button Component to prevent layout shifts
  const QuickBooksButton = ({
    size = 'medium',
    onClick,
    className = '',
  }: {
    size?: 'small' | 'medium';
    onClick: () => void;
    className?: string;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const buttonConfig = {
      small: {
        default: connectToQuickBooksSmall,
        hover: connectToQuickBooksHoverSmall,
      },
      medium: {
        default: connectToQuickBooksMed,
        hover: connectToQuickBooksHoverMed,
      },
    };

    const config = buttonConfig[size];

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };

    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`focus:outline-none transition-opacity ${className}`}
      >
        <Image src={isHovered ? config.hover : config.default} alt="Connect to QuickBooks" className="block" />
      </button>
    );
  };

  // Close popups on outside click and prevent infinite refresh
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // New company popup
      if (
        showQuickBooksPopup &&
        newCompanyPopupRef.current &&
        !newCompanyPopupRef.current.contains(event.target as Node)
      ) {
        setShowQuickBooksPopup(false);
      }
      // Per-company connect popups
      if (connectPopupCompanyId && connectPopupRefs.current[connectPopupCompanyId]) {
        const ref = connectPopupRefs.current[connectPopupCompanyId];
        if (ref && !ref.contains(event.target as Node)) {
          setConnectPopupCompanyId(null);
        }
      }
    }

    // Add event listener only when popups are open
    if (showQuickBooksPopup || connectPopupCompanyId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickBooksPopup, connectPopupCompanyId]);

  const handleAddQuickBooks = async (companyId?: string) => {
    try {
      setIsConnecting(true);
      const redirectUrl = await addConnection();
      if (redirectUrl.redirectUrl) {
        window.open(redirectUrl.redirectUrl, '_self');
      } else {
        setIsConnecting(false);
        console.error('No redirect URL provided');
      }
    } catch (error) {
      setIsConnecting(false);
      console.error(error);
      toast.error('Failed to connect to QuickBooks');
    }
  };

  const handleDisconnectQuickBooks = async (companyId: string) => {
    try {
      setDisconnectingCompanyId(companyId);
      await disconnectConnection(companyId);
      toast.success('Successfully disconnected from QuickBooks');
      // Refetch and map companies
      const companiesResponse = await getAllCompany();
      const mappedCompanies = (companiesResponse?.data || companiesResponse || []).map((company: any) => ({
        ...company,
        name: company.companyName || company.name,
        status: company.isActive ? 'ACTIVE' : 'INACTIVE',
      }));
      dispatch(setCompanies(mappedCompanies));
    } catch (error) {
      toast.error('Failed to disconnect from QuickBooks');
    } finally {
      setDisconnectingCompanyId(null);
    }
  };

  // Handle organization selection
  const handleOrganizationSelect = async (userOrg: UserOrganization) => {
    setError(null);
    dispatch(setDropDownLoading(true));

    try {
      const organizationToSelect: Organization = {
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        status: userOrg.organization.status,
        enabledFeatures: userOrg.organization.enabledFeatures || [],
        billingEmail: userOrg.organization.billingEmail,
        contactEmail: userOrg.organization.contactEmail,
        companies: [],
        role: {
          id: userOrg.role.id,
          name: userOrg.role.name,
          permissions: [],
        },
      };

      dispatch(setSelectedOrganization(organizationToSelect));

      if (user) {
        const updatedUser = {
          ...user,
          role: {
            id: userOrg.role.id,
            key: userOrg.role.key,
            name: userOrg.role.name,
            permissions: [],
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

      // Update selected company to first active company
      try {
        const companiesResponse = await getAllCompany();
        const allCompanies = companiesResponse?.data || companiesResponse || [];

        const firstActiveCompany = allCompanies.find(
          (company: any) => company.status === CompanyStatus.ACTIVE && !company.isMultiEntity
        );

        if (firstActiveCompany) {
          const companyResponse = await getCurrentCompany(firstActiveCompany.id);
          const selectedCompanyData = companyResponse?.data || companyResponse;

          dispatch(setSelectedCompany(selectedCompanyData));

          if (user) {
            const updatedUserWithCompany = {
              ...user,
              selectedCompany: selectedCompanyData,
            };

            dispatch(
              setUserData({
                user: updatedUserWithCompany,
                selectedOrganization: organizationToSelect,
                selectedCompany: selectedCompanyData,
              })
            );
          }

          document.cookie = 'has_selected_company=true; path=/';
        }
      } catch (companyError) {
        console.error('Error updating company after organization switch:', companyError);
      }

      setCurrentPage('main');

      // Close the modal after successful organization selection
      handleClose();

      if (onOrganizationChange) onOrganizationChange();
    } catch (err: any) {
      console.error('Error setting organization:', err);
      setError(err.message || 'Error setting organization');
    } finally {
      dispatch(setDropDownLoading(false));
    }
  };

  const handleCompanySelect = async (org: Organization, company: Company) => {
    setError(null);
    setSwitchingCompanyId(company.id);
    dispatch(setDropDownLoading(true));

    try {
      const response = await getCurrentCompany(company.id);
      const selectedCompanyData = response?.data || response;

      dispatch(setSelectedCompany(selectedCompanyData));

      if (user) {
        const updatedUser = {
          ...user,
          selectedCompany: selectedCompanyData,
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: selectedOrganization || undefined,
            selectedCompany: selectedCompanyData,
          })
        );
      }

      document.cookie = 'has_selected_company=true; path=/';

      // Close the modal after successful company selection
      handleClose();
      window.location.reload();

      if (onCompanyChange) onCompanyChange();
    } catch (err: any) {
      console.error('Error setting current company:', err);
      setError(err.message || 'Error setting current company');
      dispatch(setSelectedCompany(null as any));
    } finally {
      dispatch(setDropDownLoading(false));
      setSwitchingCompanyId(null);
    }
  };

  // Multi-entity form handlers
  const handleSubEntityToggle = (companyId: string) => {
    setSelectedSubEntities((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleSelectAllSubEntities = () => {
    if (selectAllSubEntities) {
      setSelectedSubEntities([]);
      setSelectAllSubEntities(false);
    } else {
      setSelectedSubEntities(allNonMultiEntityCompanies.map((company) => company.id));
      setSelectAllSubEntities(true);
    }
  };

  const handleCreateMultiEntity = async () => {
    if (!createForm.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (selectedSubEntities.length === 0) {
      toast.error('Please select at least one sub-entity');
      return;
    }

    try {
      await createMultiEntityMutation.mutateAsync({
        ...createForm,
        sub_entities: selectedSubEntities,
      });

      toast.success('Multi-entity company created successfully');
      setCurrentPage('main');
      setCreateForm({
        company_name: '',
        is_active: true,
        currency: 'USD',
        financial_year_start: 'JANUARY',
        sub_entities: [],
      });
      setSelectedSubEntities([]);
      setSelectAllSubEntities(false);

      // Close the modal after successful multi-entity creation
      handleClose();
    } catch (error) {
      console.error('Error creating multi-entity:', error);
      toast.error('Failed to create multi-entity company');
    }
  };

  const handleDeleteMultiEntity = async (companyId: string) => {
    setCompanyToDelete(companyId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteMultiEntity = async () => {
    if (!companyToDelete) return;

    try {
      await deleteMultiEntityMutation.mutateAsync(companyToDelete);
      toast.success('Multi-entity company deleted successfully');
    } catch (error) {
      console.error('Error deleting multi-entity:', error);
      toast.error('Failed to delete multi-entity company');
    } finally {
      setShowDeleteConfirmation(false);
      setCompanyToDelete(null);
    }
  };

  // Get organizations from the nested structure
  const organizations: UserOrganization[] = user?.organizations || [];

  if (!selectedOrganization || !user) return null;

  const renderHeader = (title: string, showBack: boolean = false) => {
    if (currentPage === 'create-multi-entity') {
      return (
        <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setCurrentPage('main')}
            className="p-1 hover:bg-gray-100 rounded cursor-pointer transition-colors mr-2"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h2 className="text-base font-medium text-gray-900">Create Multi-Entity Group</h2>
        </div>
      );
    }
    return (
      <div className="flex flex-col bg-white flex-shrink-0 relative">
        <div className="w-full px-4 pt-4 pb-2">
          <h2 className="text-base font-medium text-gray-900">{title}</h2>
        </div>
        <div className="flex w-full px-4 py-2 border-t border-b border-gray-200 bg-white gap-2 relative">
          <button
            onClick={() => setShowQuickBooksPopup((prev) => !prev)}
            className="flex-1 px-2 py-1.5 bg-primary text-white rounded-md font-medium text-xs cursor-pointer transition-colors shadow-sm border flex items-center justify-center"
          >
            + New Company
          </button>
          {showQuickBooksPopup && (
            <div
              ref={newCompanyPopupRef}
              className="absolute left-0 top-full mt-1 z-20 bg-white rounded-md shadow-lg p-2 flex flex-col items-center border border-gray-200"
              style={{ minWidth: '120px' }}
            >
              <QuickBooksButton
                size="medium"
                onClick={() => {
                  setShowQuickBooksPopup(false);
                  handleAddQuickBooks();
                }}
              />
            </div>
          )}
          <button
            onClick={() => setCurrentPage('create-multi-entity')}
            className="flex-1 px-2 py-1.5 bg-gray-50 text-gray-800 rounded-md font-medium text-xs hover:bg-gray-100 transition-colors border border-gray-300 flex items-center justify-center"
          >
            + New Group
          </button>
        </div>
      </div>
    );
  };

  const renderMainPage = () => (
    <div className="flex flex-col h-full">
      {renderHeader('Manage Companies')}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Companies Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Companies</h3>
            {normalCompanies.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">No companies available</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 pb-1">
                {normalCompanies.map((company) => {
                  const isActive = company.status === CompanyStatus.ACTIVE;
                  const isSelected = company.id === selectedCompany?.id;
                  const isSwitching = switchingCompanyId === company.id;
                  return (
                    <div
                      key={company.id}
                      className={`flex items-center justify-between p-2.5 rounded-md transition-colors relative ${
                        isSelected ? 'bg-gray-100' : isActive ? 'hover:bg-gray-50' : ''
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 flex-1 ${
                          isActive && !isSwitching ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        onClick={() =>
                          isActive && !isSelected && !isSwitching && handleCompanySelect(selectedOrganization, company)
                        }
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isActive ? 'bg-green-500' : 'bg-red-500'
                          } inline-block`}
                        ></span>
                        <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {company.name}
                        </span>
                        {isSwitching && <Loader2 className="h-3 w-3 animate-spin text-gray-500 ml-2" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive &&
                          (isSelected ? null : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnectQuickBooks(company.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 border border-gray-300 rounded px-2 py-1"
                              disabled={disconnectingCompanyId === company.id || isSwitching}
                            >
                              {disconnectingCompanyId === company.id ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                          ))}
                        {!isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConnectPopupCompanyId(company.id);
                            }}
                            className="text-xs text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1 border border-green-700"
                            disabled={isSwitching}
                          >
                            Connect
                          </button>
                        )}
                        {connectPopupCompanyId === company.id && (
                          <div
                            ref={(el) => {
                              connectPopupRefs.current[company.id] = el;
                            }}
                            className="absolute right-0 top-full mt-1 z-20 bg-white rounded-md shadow-lg p-2 flex flex-col items-center border border-gray-200"
                            style={{ minWidth: '120px' }}
                          >
                            <QuickBooksButton
                              size="small"
                              onClick={() => {
                                setConnectPopupCompanyId(null);
                                handleAddQuickBooks(company.id);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Entity Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Multi-Entity Groups</h3>
            {multiEntityCompanies.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">No multi-entity groups</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 pb-1">
                {multiEntityCompanies.map((company) => {
                  const isActive = company.status === CompanyStatus.ACTIVE;
                  const isSelected = company.id === selectedCompany?.id;
                  const isSwitching = switchingCompanyId === company.id;
                  return (
                    <div
                      key={company.id}
                      className={`flex items-center justify-between p-2.5 rounded-md transition-colors relative ${
                        isSelected ? 'bg-gray-100' : isActive ? 'hover:bg-gray-50' : ''
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 flex-1 ${
                          isActive && !isSwitching ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        onClick={() =>
                          isActive && !isSelected && !isSwitching && handleCompanySelect(selectedOrganization, company)
                        }
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isActive ? 'bg-green-500' : 'bg-red-500'
                          } inline-block`}
                        ></span>
                        <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {company.name}
                        </span>
                        {isSwitching && <Loader2 className="h-3 w-3 animate-spin text-gray-500 ml-2" />}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMultiEntity(company.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-gray-300 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        disabled={
                          deleteMultiEntityMutation.isPending && deleteMultiEntityMutation.variables === company.id
                        }
                      >
                        {deleteMultiEntityMutation.isPending && deleteMultiEntityMutation.variables === company.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateMultiEntityPage = () => (
    <div className="flex flex-col h-full">
      {renderHeader('Create Multi-Entity Group', true)}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={createForm.company_name}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={createForm.currency}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Financial Year Start</label>
              <input
                type="text"
                value={createForm.financial_year_start}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-gray-700">Sub-Entities</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAllSubEntities}
                  onChange={handleSelectAllSubEntities}
                  className="w-3.5 h-3.5 text-gray-600 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="select-all" className="text-xs font-medium text-gray-700 cursor-pointer ml-1.5">
                  Select All
                </label>
              </div>
            </div>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                {allNonMultiEntityCompanies.map((company) => (
                  <div key={company.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={company.id}
                      checked={selectedSubEntities.includes(company.id)}
                      onChange={() => handleSubEntityToggle(company.id)}
                      className="w-3.5 h-3.5 text-gray-600 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor={company.id} className="text-xs text-gray-700 cursor-pointer">
                      {company.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setCurrentPage('main')}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMultiEntity}
            disabled={
              createMultiEntityMutation.isPending || !createForm.company_name.trim() || selectedSubEntities.length === 0
            }
            className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMultiEntityMutation.isPending ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use Dialog for modal
  return (
    <>
      <Dialog
        key={`company-modal-${isOpen}`}
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent
          className={`fixed z-50 w-96 h-[600px] mx-4 p-0 bg-white rounded-lg shadow-lg border-none flex flex-col overflow-hidden`}
          style={{
            left: isConsolidationRoute ? '17rem' : isSidebarOpen ? '17rem' : '5rem',
            top: '5rem',
            margin: 0,
            transform: 'none',
          }}
        >
          <DialogTitle className="sr-only">Company Selection</DialogTitle>
          {currentPage === 'main' && renderMainPage()}
          {currentPage === 'create-multi-entity' && renderCreateMultiEntityPage()}

          {/* Loading overlay when switching company */}
          {switchingCompanyId && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E925A]" />
                <p className="text-sm font-medium text-primary">Switching company...</p>
              </div>
            </div>
          )}

          {/* Loading overlay when connecting to QuickBooks */}
          {isConnecting && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E925A]" />
                <p className="text-sm font-medium text-primary">Connecting to QuickBooks...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Multi-Entity Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this multi-entity company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirmation(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteMultiEntity}
              disabled={deleteMultiEntityMutation.isPending}
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMultiEntityMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
