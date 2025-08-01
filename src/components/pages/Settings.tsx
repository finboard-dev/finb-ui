'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { logout } from '@/lib/api/logout';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setMainContent, setActiveSettingsSection, selectActiveSettingsSection } from '@/lib/store/slices/uiSlice';
import Image from 'next/image';
import connectToQuickBooksMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_transparent_btn_med_default.svg';
import connectToQuickBooksHoverMed from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_transparent_btn_med_hover.svg';
import connectToQuickBooksHoverSmall from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_hover.svg';
import connectToQuickbooksSmall from '@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_default.svg';
import { toast } from 'sonner';
import { Search, ChevronDown, Trash2, X, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Dialog as AlertDialog,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogFooter as AlertDialogFooter,
} from '@/components/ui/dialog';
import { useUrlParams } from '@/lib/utils/urlParams';
import {
  useOrganizationConnections,
  useAddConnection,
  useDisconnectConnection,
  useOrganizationCompanies,
  useOrganizationUsers,
  useAddOrganizationUser,
  useUpdateOrganizationUser,
  useDeleteOrganizationUser,
  useUpdateOrganizationName,
} from '@/hooks/query-hooks/useOrganization';
import { useClearReduxState } from '@/hooks/useClearReduxState';
import { clearBearerToken } from '@/lib/auth/tokenUtils';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  lastRefreshedAt: string;
}

// Add enum for roles
const USER_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  EXTERNAL_MEMBER: 'EXTERNAL_MEMBER',
};

const Settings = ({ onBackClick }: { onBackClick: () => void }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateToSettings, navigateToChatSettings, navigateToContent, navigateToChat } = useUrlParams();
  const state = store.getState();
  const clearReduxState = useClearReduxState();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isConnecting, setIsConnecting] = useState(false);
  const activeSection = useAppSelector(selectActiveSettingsSection);

  const user = store.getState().user.selectedCompany;
  const company_id = user?.id;
  const organizationId = state.user.selectedOrganization?.id;

  // Use actual user data from Redux store
  const userData = store.getState().user.user;

  const isSuperAdmin = userData?.role?.key === 'SUPER_ADMIN';

  // Debug logging
  console.log('Settings component state:', {
    selectedCompany: user,
    company_id,
    selectedOrganization: state.user.selectedOrganization,
    organizationId,
    userData,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(USER_ROLES.ADMIN);
  const [inviteCompanies, setInviteCompanies] = useState<string[]>([]);
  const [selectAllCompanies, setSelectAllCompanies] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [originalCompanyAccess, setOriginalCompanyAccess] = useState<string[]>([]);
  const [companyAccessDraft, setCompanyAccessDraft] = useState<string[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [initialUsersLoading, setInitialUsersLoading] = useState(true);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [inviteUserLoading, setInviteUserLoading] = useState(false);
  const [updateUserLoading, setUpdateUserLoading] = useState(false);
  const [showAllOrgsModal, setShowAllOrgsModal] = useState(false);
  const [isEditingOrgName, setIsEditingOrgName] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState('');

  // React Query hooks
  const {
    data: dataSources,
    isLoading: isLoadingConnections,
    isFetching: isFetchingConnections,
    error: connectionsError,
    refetch: refetchConnections,
  } = useOrganizationConnections();
  const { data: orgCompanies, isLoading: isLoadingCompanies } = useOrganizationCompanies();
  const {
    data: orgUsers,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useOrganizationUsers();

  // Mutation hooks
  const addConnectionMutation = useAddConnection();
  const disconnectConnectionMutation = useDisconnectConnection();
  const addUserMutation = useAddOrganizationUser();
  const updateUserMutation = useUpdateOrganizationUser();
  const deleteUserMutation = useDeleteOrganizationUser();
  const updateOrgNameMutation = useUpdateOrganizationName();

  // Loading states for individual operations
  const [disconnectingConnectionId, setDisconnectingConnectionId] = useState<string | null>(null);

  // Handle settings section from URL parameters
  useEffect(() => {
    const sectionFromUrl = searchParams.get('settings-section');
    const section = searchParams.get('section');

    // Handle both old settings-section and new section parameters
    const activeSection = section || sectionFromUrl;

    if (activeSection && ['data-connections', 'profile', 'users-roles', 'organization'].includes(activeSection)) {
      dispatch(setActiveSettingsSection(activeSection as any));
      // Ensure we're in settings view when settings-section parameter is present
      dispatch(setMainContent('settings'));
    }
  }, [dispatch, searchParams]);

  const handleSectionChange = (section: 'data-connections' | 'profile' | 'users-roles' | 'organization') => {
    dispatch(setActiveSettingsSection(section));
    // Use the new navigateToChatSettings function for the chat settings route
    navigateToChatSettings(section);
  };

  const companyPermissions = {
    Finboard: 'Full Access',
    Amazon: 'No Access',
    Tesla: 'No Access',
    Stripe: 'Full Access',
    FindOnline: 'Full Access',
    'Coca Cola': 'Full Access',
  };

  useEffect(() => {
    if (showCompanyModal && selectedUser) {
      setCompanyAccessDraft(
        (selectedUser.accessibleCompanies || []).filter((c: any) => c.status === 'ACTIVE').map((c: any) => c.id)
      );
    }
  }, [showCompanyModal, selectedUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 mr-1 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 mr-1 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleConnect = async (sourceId: string) => {
    try {
      setIsConnecting(true);
      const result = await addConnectionMutation.mutateAsync();
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_self');
      } else {
        console.error('No redirect URL provided');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (sourceId: string) => {
    try {
      setDisconnectingConnectionId(sourceId);
      await disconnectConnectionMutation.mutateAsync(sourceId);
    } catch (error) {
      console.error('Error disconnecting account:', error);
    } finally {
      setDisconnectingConnectionId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearBearerToken();
      await clearReduxState();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (e) {
      console.error('Error during logout:', e);
      alert('Error during logout. Please try again.');
    }
  };

  const filteredSources =
    activeTab === 'all'
      ? dataSources || []
      : (dataSources || []).filter((source: any) => source.status.toLowerCase() === activeTab.toLowerCase());

  const renderDataConnections = () => (
    <Card className="border-gray-200 w-full">
      <div className={'w-full flex justify-between items-center px-6'}>
        <div>
          <div className="text-xl font-semibold">Data Source</div>
          <div className="text-gray-500">Manage your QuickBooks and other data connections</div>
        </div>
        <button className={'min-w-fit'} onClick={() => handleConnect('')} disabled={isConnecting}>
          <Image
            src={connectToQuickBooksMed || '/placeholder.svg'}
            className="w-full h-full"
            alt="Connect to QuickBooks"
            onMouseEnter={(e) => (e.currentTarget.src = connectToQuickBooksHoverMed.src)}
            onMouseLeave={(e) => (e.currentTarget.src = connectToQuickBooksMed.src)}
          />
        </button>
      </div>
      <CardContent>
        <div className="flex items-center justify-between mb-7">
          {/*<Tabs value={activeTab} onValueChange={setActiveTab}>*/}
          {/*    <TabsList className="flex space-x-2 rounded-md bg-gray-100 p-1">*/}
          {/*        <TabsTrigger*/}
          {/*            value="all"*/}
          {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "all" ? "bg-white shadow-sm" : ""}`}*/}
          {/*        >*/}
          {/*            All*/}
          {/*        </TabsTrigger>*/}
          {/*        <TabsTrigger*/}
          {/*            value="connected"*/}
          {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "connected" ? "bg-white shadow-sm" : ""}`}*/}
          {/*        >*/}
          {/*            Connected*/}
          {/*        </TabsTrigger>*/}
          {/*        <TabsTrigger*/}
          {/*            value="disconnected"*/}
          {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "disconnected" ? "bg-white shadow-sm" : ""}`}*/}
          {/*        >*/}
          {/*            Disconnected*/}
          {/*        </TabsTrigger>*/}
          {/*        <TabsTrigger*/}
          {/*            value="expired"*/}
          {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "expired" ? "bg-white shadow-sm" : ""}`}*/}
          {/*        >*/}
          {/*            Expired*/}
          {/*        </TabsTrigger>*/}
          {/*    </TabsList>*/}
          {/*</Tabs>*/}
        </div>

        {isLoadingConnections ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-lg text-gray-600">Loading...</span>
          </div>
        ) : isConnecting ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-lg text-gray-600">Connecting...</span>
          </div>
        ) : connectionsError ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load data sources. Please try again.</p>
            <Button variant="outline" onClick={() => refetchConnections()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No data sources found.</p>
            <button onClick={() => handleConnect('')} disabled={isConnecting} className="mt-4">
              <Image
                src={connectToQuickBooksMed || '/placeholder.svg'}
                alt="Connect to QuickBooks"
                onMouseEnter={(e) => (e.currentTarget.src = connectToQuickBooksHoverMed.src)}
                onMouseLeave={(e) => (e.currentTarget.src = connectToQuickBooksMed.src)}
              />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                  <TableHead className="px-4 py-3">Name</TableHead>
                  <TableHead className="px-4 py-3">Source</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Last Updated</TableHead>
                  <TableHead className="px-4 py-3">ID</TableHead>
                  <TableHead className="px-4 py-3">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source: any) => (
                  <TableRow key={source.id} className="border-b border-gray-300 text-sm">
                    <TableCell className="px-4 py-3">{source.name}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className={`flex items-center ${getStatusColor(source.status)}`}>
                        {getStatusIcon(source.status)}
                        {source.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">{formatDate(source.lastRefreshedAt)}</TableCell>
                    <TableCell className="px-4 py-3">{source.id.substring(0, 8)}...</TableCell>
                    <TableCell className="px-4 py-3">
                      {source.status === 'ACTIVE' && (
                        <button
                          className="text-red-600 cursor-pointer hover:text-red-800 underline-offset-1"
                          onClick={() => handleDisconnect(source.id)}
                          disabled={isConnecting || disconnectingConnectionId === source.id}
                        >
                          {disconnectingConnectionId === source.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              Disconnecting...
                            </div>
                          ) : (
                            'Disconnect'
                          )}
                        </button>
                      )}
                      {source.status === 'INACTIVE' && (
                        <button onClick={() => handleConnect(source.id)} disabled={isConnecting}>
                          <Image
                            src={connectToQuickbooksSmall || '/placeholder.svg'}
                            alt={'Connect to QuickBooks'}
                            onMouseEnter={(e) => {
                              const img = e.currentTarget;
                              img.src = connectToQuickBooksHoverSmall.src;
                            }}
                            onMouseLeave={(e) => {
                              const img = e.currentTarget;
                              img.src = connectToQuickbooksSmall.src;
                            }}
                          />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // const renderProfile = () => {
  //   const userData = store.getState().user.user;

  //   const formatDate = (dateString: string) => {
  //     return new Date(dateString).toLocaleString('en-US', {
  //       year: 'numeric',
  //       month: 'short',
  //       day: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit',
  //     });
  //   };

  //   return (
  //     <div className="space-y-6">
  //       {/* Profile Card */}
  //       <Card className="border-gray-200">
  //         <CardHeader>
  //           <CardTitle className="text-xl font-semibold">Profile</CardTitle>
  //           <CardDescription className="text-gray-500">Your account details</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-8">
  //             {/* Personal Information Section */}
  //             <div>
  //               <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
  //               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  //                 <div className="space-y-1">
  //                   <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
  //                   <p className="text-sm text-gray-900">
  //                     {userData ? `${userData.firstName} ${userData.lastName}` : 'Not available'}
  //                   </p>
  //                 </div>
  //                 <div className="space-y-1">
  //                   <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
  //                   <p className="text-sm text-gray-900">{userData?.email || 'Not available'}</p>
  //                 </div>
  //                 <div className="space-y-1">
  //                   <p className="text-xs text-gray-500 uppercase tracking-wide">Last Login</p>
  //                   <p className="text-sm text-gray-900">
  //                     {userData?.lastLoginTime ? formatDate(userData.lastLoginTime) : 'Not available'}
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // };

  const renderOrganization = () => {
    const selectedOrganization = store.getState().user.selectedOrganization;
    const userData = store.getState().user.user;
    const organizations = userData?.organizations || [];

    const handleEditOrgName = () => {
      if (selectedOrganization) {
        setOrgNameDraft(selectedOrganization.name);
        setIsEditingOrgName(true);
      }
    };

    const handleSaveOrgName = async () => {
      if (!selectedOrganization || !orgNameDraft.trim()) {
        toast.error('Please enter a valid organization name');
        return;
      }

      try {
        await updateOrgNameMutation.mutateAsync({
          organizationId: selectedOrganization.id,
          name: orgNameDraft.trim(),
        });
        toast.success('Organization name updated successfully!');
        setIsEditingOrgName(false);
        setOrgNameDraft('');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update organization name');
      }
    };

    const handleCancelEdit = () => {
      setIsEditingOrgName(false);
      setOrgNameDraft('');
    };

    return (
      <div className="space-y-6">
        {/* Current Organization Card */}
        <Card className="border-gray-200">
          {/* <CardHeader>
            <CardTitle className="text-xl font-semibold">Current Organization</CardTitle>
            <CardDescription className="text-gray-500">Manage your current organization settings</CardDescription>
          </CardHeader> */}
          <CardContent>
            {selectedOrganization ? (
              <div className="space-y-6">
                {/* Organization Name Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Organization Name</h3>
                  </div>

                  {isEditingOrgName ? (
                    <div className="inline-flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3">
                      <input
                        type="text"
                        value={orgNameDraft}
                        onChange={(e) => setOrgNameDraft(e.target.value)}
                        className="w-80 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-medium"
                        placeholder="Enter organization name"
                        autoFocus
                        maxLength={64}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveOrgName}
                          disabled={updateOrgNameMutation.isPending}
                          size="sm"
                          className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 h-8"
                        >
                          {updateOrgNameMutation.isPending ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span className="text-xs">Saving</span>
                            </div>
                          ) : (
                            <span className="text-xs">Save</span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updateOrgNameMutation.isPending}
                          size="sm"
                          className="text-gray-700 border-gray-300 hover:bg-gray-50 px-3 py-1 h-8"
                        >
                          <span className="text-xs">Cancel</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3">
                      <span className="w-80 text-gray-900 font-medium">{selectedOrganization.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditOrgName}
                        className="text-gray-500 hover:text-gray-700 p-1 h-8 w-8"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Organization Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedOrganization.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className="text-sm text-gray-900 capitalize">
                          {selectedOrganization.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Your Role</p>
                      <p className="text-sm text-gray-900">{selectedOrganization.role?.name || 'Not specified'}</p>
                    </div>
                    {selectedOrganization.enabledFeatures && selectedOrganization.enabledFeatures.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Enabled Features</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedOrganization.enabledFeatures.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedOrganization.billingEmail && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Billing Email</p>
                        <p className="text-sm text-gray-900">{selectedOrganization.billingEmail}</p>
                      </div>
                    )}
                    {selectedOrganization.contactEmail && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Email</p>
                        <p className="text-sm text-gray-900">{selectedOrganization.contactEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No organization selected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLogout = () => (
    <Card className="shadow-lg border-gray-200 w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Logout</CardTitle>
        <CardDescription className="text-gray-500">Sign out of your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={handleLogout}>
          Confirm Logout
        </Button>
      </CardContent>
    </Card>
  );

  const renderUsersRoles = () => {
    const filteredOrgUsers = (orgUsers || []).filter((user: any) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        (user.name && user.name.toLowerCase().includes(term)) || (user.email && user.email.toLowerCase().includes(term))
      );
    });
    return (
      <Card className="border-gray-200 bg-white shadow-sm w-full">
        <CardHeader className="bg-white border-b border-gray-100 px-6 py-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Users & Roles</CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Manage your team's access and roles within the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Find by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Role filter can be kept or removed as needed */}
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => refetchUsers()}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                  disabled={isFetchingUsers}
                >
                  {isFetchingUsers ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Refreshing...
                    </div>
                  ) : (
                    'Refresh'
                  )}
                </Button>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-gray-800 hover:bg-gray-900 text-white border-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Add User
                </Button>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {isLoadingUsers ? (
              <div className="flex justify-center items-center h-40 w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                  <span className="text-lg text-gray-600">Loading users...</span>
                </div>
              </div>
            ) : isFetchingUsers && !orgUsers ? (
              <div className="flex justify-center items-center h-40 w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                  <span className="text-lg text-gray-600">Refreshing users...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="bg-white min-w-[800px]">
                  <TableHeader className="bg-gray-50">
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-gray-600 font-medium px-6 py-4 bg-gray-50">Name</TableHead>
                      <TableHead className="text-gray-600 font-medium px-6 py-4 bg-gray-50">Email</TableHead>
                      <TableHead className="text-gray-600 font-medium px-6 py-4 bg-gray-50">Role</TableHead>
                      <TableHead className="text-gray-600 font-medium px-6 py-4 bg-gray-50">Company Access</TableHead>
                      {isSuperAdmin && (
                        <TableHead className="text-gray-600 font-medium px-6 py-4 bg-gray-50">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {filteredOrgUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrgUsers.map((user: any) => (
                        <TableRow key={user.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                          <TableCell className="px-6 py-4 font-medium text-gray-900 bg-white">{user.name}</TableCell>
                          <TableCell className="px-6 py-4 text-gray-600 bg-white">{user.email}</TableCell>
                          <TableCell className="px-6 py-4 text-gray-600 bg-white">{user.roleId}</TableCell>
                          <TableCell className="px-6 py-4 bg-white">
                            {user.roleId === 'SUPER_ADMIN' ? (
                              <span>All companies accessible</span>
                            ) : (
                              (() => {
                                const accessString =
                                  user.accessibleCompanies && user.accessibleCompanies.length > 0
                                    ? user.accessibleCompanies
                                        .filter((c: any) => c.status === 'ACTIVE')
                                        .map((c: any) => c.name)
                                        .join(', ') || 'No Company'
                                    : 'No Company';
                                const truncated =
                                  accessString.length > 10 ? accessString.slice(0, 10) + '...' : accessString;
                                return (
                                  <button
                                    onClick={() => {
                                      if (isSuperAdmin) {
                                        setSelectedUser(user);
                                        setShowCompanyModal(true);
                                        setOriginalCompanyAccess(
                                          (user.accessibleCompanies || [])
                                            .filter((c: any) => c.status === 'ACTIVE')
                                            .map((c: any) => c.id)
                                        );
                                      }
                                    }}
                                    className={`flex items-center text-gray-600 bg-transparent border-none ${
                                      isSuperAdmin ? 'hover:text-gray-800 cursor-pointer' : 'cursor-default'
                                    }`}
                                    title={isSuperAdmin ? accessString : 'Only super admins can modify company access'}
                                  >
                                    {truncated}
                                    {isSuperAdmin && <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />}
                                  </button>
                                );
                              })()
                            )}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="px-6 py-4 bg-white">
                              <button
                                className="text-gray-400 hover:text-red-600 bg-transparent border-none"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Company Access Modal */}
          <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl rounded-lg">
              <DialogHeader className="bg-white border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900">Company access</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedUser ? selectedUser?.name : ''} has access to{' '}
                      {(selectedUser?.accessibleCompanies || []).filter((c: any) => c.status === 'ACTIVE').length}{' '}
                      companies
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-4 bg-white pb-6">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-600 font-medium px-6 py-3">Company Name</TableHead>
                        <TableHead className="text-gray-600 font-medium px-6 py-3">Permissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orgCompanies || []).map((company: any) => {
                        const isActive = company.status === 'ACTIVE';
                        const userHasAccess = selectedUser?.accessibleCompanies?.some(
                          (c: any) => c.id === company.id && c.status === 'ACTIVE'
                        );
                        return (
                          <TableRow key={company.id} className="border-b border-gray-100">
                            <TableCell className="px-6 py-3">
                              <span className="text-gray-900 font-medium">{company.name}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                              <Select
                                value={companyAccessDraft.includes(company.id) ? 'Full Access' : 'No Access'}
                                disabled={!isActive || !isSuperAdmin}
                                onValueChange={(value) => handleCompanyAccessChange(company.id, value)}
                              >
                                <SelectTrigger className="w-32 bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                  <SelectValue className="text-gray-900" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                                  <SelectItem
                                    value="Full Access"
                                    className="hover:bg-gray-50 focus:bg-gray-50"
                                    disabled={!isActive}
                                  >
                                    <span className="text-green-600 font-medium">Full Access</span>
                                  </SelectItem>
                                  <SelectItem
                                    value="No Access"
                                    className="hover:bg-gray-50 focus:bg-gray-50"
                                    disabled={!isActive}
                                  >
                                    <span className="text-gray-500 font-medium">No Access</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 flex justify-end bg-white border-t border-gray-100 pt-4">
                  <Button
                    onClick={handleSaveCompanyAccess}
                    className="bg-gray-800 hover:bg-gray-900 text-white border-gray-800 px-4 py-2 rounded-md font-medium"
                    disabled={!isCompanyAccessChanged() || updateUserLoading}
                  >
                    {updateUserLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Invite/Manage Users Modal */}
          <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl rounded-lg">
              <DialogHeader className="bg-white border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900">Manage Users</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details to invite a user</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-4 space-y-4 bg-white px-6 pb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quickbooks Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as keyof typeof USER_ROLES)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value={USER_ROLES.ADMIN} className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50">
                        ADMIN
                      </SelectItem>
                      <SelectItem value={USER_ROLES.MEMBER} className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50">
                        MEMBER
                      </SelectItem>
                      <SelectItem
                        value={USER_ROLES.EXTERNAL_MEMBER}
                        className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        EXTERNAL_MEMBER
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {inviteRole !== USER_ROLES.ADMIN && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Companies</label>
                    <div className="border border-gray-300 rounded-md p-2">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectAllCompanies}
                          onChange={handleSelectAllCompanies}
                          disabled={inviteRole === USER_ROLES.ADMIN}
                          className="mr-2"
                        />
                        <span className="text-sm">Select All</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {(orgCompanies || [])
                          .filter((c: any) => c.status === 'ACTIVE')
                          .map((company: any) => (
                            <div key={company.id} className="flex items-center mb-1">
                              <input
                                type="checkbox"
                                checked={inviteCompanies.includes(company.id)}
                                onChange={() => handleCompanySelect(company.id)}
                                disabled={inviteRole === USER_ROLES.ADMIN}
                                className="mr-2"
                              />
                              <span className="text-sm">{company.name}</span>
                            </div>
                          ))}
                        {(orgCompanies || []).filter((c: any) => c.status === 'ACTIVE').length === 0 && (
                          <span className="text-gray-400 text-sm">No active companies available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4 bg-white border-t border-gray-100">
                  <Button
                    onClick={handleSendInvite}
                    className="bg-gray-800 hover:bg-gray-900 text-white border-gray-800 px-4 py-2 rounded-md font-medium"
                    disabled={inviteUserLoading}
                  >
                    {inviteUserLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding User...
                      </div>
                    ) : (
                      'Add User'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete User Alert Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="max-w-md bg-white border border-gray-200 shadow-xl rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="px-6 pb-6 text-gray-700">
                Are you sure you want to delete this user? This action cannot be undone.
              </div>
              <AlertDialogFooter className="flex justify-end gap-2 px-6 pb-4">
                <Button
                  className="text-gray-900 border-none shadow-none"
                  variant="secondary"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteUserLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="text-white"
                  onClick={handleDeleteUser}
                  disabled={deleteUserLoading}
                >
                  {deleteUserLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  };

  const activeCompanies = (orgCompanies || []).filter((c: any) => c.status === 'ACTIVE');

  const handleCompanySelect = (companyId: string) => {
    if (inviteCompanies.includes(companyId)) {
      setInviteCompanies(inviteCompanies.filter((id) => id !== companyId));
      setSelectAllCompanies(false);
    } else {
      const newSelected = [...inviteCompanies, companyId];
      setInviteCompanies(newSelected);
      if (newSelected.length === activeCompanies.length) setSelectAllCompanies(true);
    }
  };

  const handleSelectAllCompanies = () => {
    if (selectAllCompanies) {
      setInviteCompanies([]);
      setSelectAllCompanies(false);
    } else {
      setInviteCompanies(activeCompanies.map((c: any) => c.id));
      setSelectAllCompanies(true);
    }
  };

  const handleSendInvite = async () => {
    // Validation
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim() || !inviteRole) {
      toast.error('All fields are required.');
      return;
    }
    if (inviteRole !== USER_ROLES.ADMIN && inviteCompanies.length === 0) {
      toast.error('Please select at least one company.');
      return;
    }
    const formData: any = {
      organizationId: organizationId,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      email: inviteEmail,
      role: inviteRole,
    };
    if (inviteRole !== USER_ROLES.ADMIN) {
      formData.companies = inviteCompanies;
    }
    setInviteUserLoading(true);
    try {
      await addUserMutation.mutateAsync(formData);
      toast.success('User invited successfully!');
      setShowInviteModal(false);
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      setInviteRole(USER_ROLES.ADMIN);
      setInviteCompanies([]);
      setSelectAllCompanies(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to invite user.');
    } finally {
      setInviteUserLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteUserLoading(true);
    try {
      await deleteUserMutation.mutateAsync({
        userId: userToDelete.userId,
        organizationId: userToDelete.organizationId,
      });
      toast.success('User deleted successfully!');
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const handleCompanyAccessChange = (companyId: string, value: string) => {
    setCompanyAccessDraft((prev) => {
      if (value === 'Full Access') {
        return Array.from(new Set([...prev, companyId]));
      } else {
        return prev.filter((id) => id !== companyId);
      }
    });
  };

  const isCompanyAccessChanged = () => {
    // Compare sorted arrays
    const a = [...originalCompanyAccess].sort();
    const b = [...companyAccessDraft].sort();
    return a.length !== b.length || a.some((id, i) => id !== b[i]);
  };

  const handleSaveCompanyAccess = async () => {
    if (!selectedUser) return;
    const payload = {
      organizationId: selectedUser.organizationId,
      userId: selectedUser.userId,
      role: selectedUser.roleId,
      companies: companyAccessDraft,
    };
    setUpdateUserLoading(true);
    try {
      await updateUserMutation.mutateAsync(payload);
      toast.success('User access updated successfully!');
      setShowCompanyModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user access.');
    } finally {
      setUpdateUserLoading(false);
    }
  };

  const handleBackClick = () => {
    console.log('handleBackClick called');

    // Get the current active chat ID from Redux state
    const currentState = store.getState();
    const activeChatId = currentState.chat.activeChatId;
    const chats = currentState.chat.chats;

    console.log('activeChatId:', activeChatId);
    console.log('chats:', chats);

    // Find the chat with the active chat ID to get its thread_id
    const activeChat = chats.find((chat: any) => chat.id === activeChatId);
    const threadId = activeChat?.thread_id;

    console.log('activeChat:', activeChat);
    console.log('threadId:', threadId);

    if (threadId) {
      // If we have a thread ID, navigate back to that specific chat
      console.log('Navigating to chat with threadId:', threadId);
      navigateToChat(threadId);
    } else {
      // Fallback to general chat navigation
      console.log('Fallback to general chat navigation');
      navigateToContent('chat');
    }

    onBackClick();
  };

  return (
    <div className="flex-1 mt-12">
      {/* Header */}
      {/* <div className="flex pt-8 items-center pl-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="border border-gray-200 rounded-md p-3 max-h-fit mr-4"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Button>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div> */}

      <div className="flex w-full h-full gap-5 px-6 justify-center">
        {/* Settings Sidebar */}
        <div className="min-w-fit text-wrap flex justify-end">
          <nav className="text-base items-start flex flex-col h-[calc(100vh-200px)] justify-between">
            <div className="space-y-3">
              <button
                onClick={() => handleSectionChange('data-connections')}
                className={`block rounded-md px-3 py-2 font-medium ${
                  activeSection === 'data-connections' ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Data Connections
              </button>
              {/* <button
                onClick={() => handleSectionChange('profile')}
                className={`block rounded-md px-3 py-2 font-medium ${
                  activeSection === 'profile' ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Profile
              </button> */}

              <button
                onClick={() => handleSectionChange('users-roles')}
                className={`block rounded-md px-3 py-2 font-medium ${
                  activeSection === 'users-roles' ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => handleSectionChange('organization')}
                className={`block rounded-md px-3 py-2 font-medium ${
                  activeSection === 'organization' ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Organization
              </button>
            </div>

            <Button
              onClick={handleLogout}
              variant={'destructive'}
              className={
                'cursor-pointer block rounded-md text-gray-700 hover:bg-gray-200 px-3 py-2 bg-gray-100 font-medium  mt-auto'
              }
            >
              Logout
            </Button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="overflow-x-auto w-full">
          <div className="min-w-lg:max-w-2xl w-full">
            {activeSection === 'data-connections' && renderDataConnections()}
            {/* {activeSection === 'profile' && renderProfile()} */}
            {activeSection === 'users-roles' && renderUsersRoles()}
            {activeSection === 'organization' && renderOrganization()}
            {/*{activeSection === "logout" && renderLogout()}*/}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
