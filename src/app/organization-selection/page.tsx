'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedOrganization, setUserData, clearCompanies, selectRedirectTo } from '@/lib/store/slices/userSlice';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateOrganization } from '@/hooks/query-hooks/useOrganization';
import { useOnboardingForm } from '@/hooks/query-hooks/useOnboarding';
import { setNewUserFalse } from '@/lib/store/slices/userSlice';

const OrganizationSelectionPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const token = useAppSelector((state) => state.user.token);
  const newUser = useAppSelector((state) => state.user.newUser);
  const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization);
  const redirectTo = useAppSelector(selectRedirectTo);
  const isSelectedCompanyNull = useAppSelector(
    (state) => state.user.selectedCompany === null || state.user.selectedCompany === undefined
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // React Query mutations
  const createOrganizationMutation = useCreateOrganization();
  const onboardingFormMutation = useOnboardingForm();

  useEffect(() => {
    if (!token?.accessToken) {
      router.push('/login');
    }
  }, [token, router]);

  // Handle organization logic
  useEffect(() => {
    console.log('Organization selection - user organizations:', user?.organizations);
    console.log('Current selected organization:', selectedOrganization);

    if (!user?.organizations || hasAutoSelected) {
      return; // Still loading or already auto-selected
    }

    if (user.organizations.length === 0) {
      console.log('No organizations found, showing onboarding form');
      // setShowOnboardingForm(true);
    } else if (user.organizations.length === 1) {
      console.log('One organization found, auto-selecting');
      setHasAutoSelected(true); // Prevent infinite loop

      // Auto-select the single organization
      const org = user.organizations[0];
      const organizationToSelect = {
        id: org.organization.id,
        name: org.organization.name,
        status: org.organization.status,
        enabledFeatures: org.organization.enabledFeatures || [],
        billingEmail: org.organization.billingEmail,
        contactEmail: org.organization.contactEmail,
        companies: [], // Will be populated when companies are loaded
        role: {
          id: org.role.id,
          name: org.role.name,
          permissions: [], // You might need to fetch permissions separately
        },
      };

      // Clear companies array to ensure fresh start for new organization
      dispatch(clearCompanies());

      // Update the selected organization
      dispatch(setSelectedOrganization(organizationToSelect));

      // Update the user's role to match the selected organization's role
      const updatedUser = {
        ...user,
        role: {
          id: org.role.id,
          key: org.role.key,
          name: org.role.name,
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

      // Set cookie to indicate organization is selected
      document.cookie = 'has_selected_organization=true; path=/; SameSite=Lax; Secure';

      // Always redirect to company selection first, even if we have redirectTo
      // The company selection page will handle the redirectTo logic
      console.log('Organization selected, redirecting to company selection');
      router.push('/company-selection');
    } else if (user.organizations.length > 1 && selectedOrganization) {
      // If user has multiple organizations and one is already selected,
      // don't auto-redirect but preselect the current one
      console.log('Multiple organizations found with existing selection, staying on page');
      setHasAutoSelected(true); // Prevent infinite loop
    }
    // If multiple organizations, stay on this page for selection
  }, [user, hasAutoSelected, selectedOrganization]);

  // Show loading state while user data is being loaded
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
          <div className="mb-8 flex items-center">
            {isSelectedCompanyNull ? (
              <></>
            ) : (
              <button onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-16 w-16 animate-spin text-gray-400" />
            <h2 className="text-2xl font-semibold">Loading user data...</h2>
            <p className="text-gray-500">Please wait while we fetch your information</p>
          </div>
        </div>
      </div>
    );
  }

  // Initialize selectedOrgId with the current selected organization if it exists
  useEffect(() => {
    if (selectedOrganization && user?.organizations) {
      // Check if the selected organization exists in the user's organizations
      const orgExists = user.organizations.some((org) => org.organization.id === selectedOrganization.id);

      if (orgExists) {
        setSelectedOrgId(selectedOrganization.id);
        console.log('Preselecting organization:', selectedOrganization.name);
      }
    }
  }, [selectedOrganization, user?.organizations]);

  const handleOrganizationSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  // Onboarding questions and options
  const onboardingQuestions = {
    isAccountingFirm: 'Are you an accounting/bookkeeping firm managing multiple clients?',
    source: 'How did you hear about FinBoard?',
    timeSpent: 'How much time do you or your team typically spend on financial reporting in a month?',
    sheetsFamiliarity: 'How familiar are you with the Google Sheets ecosystem?',
    desiredOutcome: 'What outcome are you hoping FinBoard will help you achieve?',
    finboardHelpful:
      'If you find Finboard helpful, would you be open to sharing your experience on the QuickBooks App Store? It helps small teams like ours grow through word of mouth.',
    organizationName: 'What is your organization name?',
  };

  const sourceOptions = [
    { id: 1, name: 'Google Ads' },
    { id: 2, name: 'QuickBook App Store' },
    { id: 3, name: 'Google Workspace Marketplace' },
    { id: 4, name: 'Social Media (Reddit, etc.)' },
    { id: 5, name: 'Friend or Colleague Recommendation' },
    { id: 6, name: 'Other' },
  ];

  const timeSpentOptions = [
    { id: 1, name: '0-4 hours' },
    { id: 2, name: '4-8 hours' },
    { id: 3, name: '1-2 days' },
    { id: 4, name: '2-4 days' },
    { id: 5, name: '>4 days' },
  ];

  const sheetsFamiliarityOptions = [
    { id: 1, name: 'Beginner – view or make simple edits' },
    { id: 2, name: 'Intermediate – use formulas, filters, basic charts' },
    { id: 3, name: 'Advanced – build dashboards, pivot tables, or automations' },
  ];

  const finboardHelpfulOptions = [
    { id: 1, name: '✓ Yes, happy to if I find value' },
    { id: 2, name: '✗ No, not at this time' },
  ];

  const isOnboardingStepValid = (): boolean => {
    switch (onboardingStep) {
      case 1:
        return Boolean(
          onboardingAnswers[onboardingQuestions.isAccountingFirm] &&
            onboardingAnswers[onboardingQuestions.source] &&
            (onboardingAnswers[onboardingQuestions.source] !== 'Other' ||
              (onboardingAnswers[onboardingQuestions.source] === 'Other' && onboardingAnswers['sourceOther']?.trim()))
        );
      case 2:
        return Boolean(
          onboardingAnswers[onboardingQuestions.timeSpent] && onboardingAnswers[onboardingQuestions.sheetsFamiliarity]
        );
      case 3:
        return Boolean(
          onboardingAnswers[onboardingQuestions.desiredOutcome]?.trim() &&
            onboardingAnswers[onboardingQuestions.finboardHelpful]
        );
      case 4:
        return Boolean(onboardingAnswers[onboardingQuestions.organizationName]?.trim());
      default:
        return false;
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep < 4) {
      setOnboardingStep(onboardingStep + 1);
      setError(null);
    } else {
      handleOnboardingSubmit();
    }
  };

  const handleOnboardingBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
      setError(null);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!onboardingAnswers[onboardingQuestions.organizationName]?.trim()) {
      setError('Please enter your organization name');
      return;
    }

    setError(null);

    try {
      const response = await onboardingFormMutation.mutateAsync({
        orgName: onboardingAnswers[onboardingQuestions.organizationName],
        userInputs: onboardingAnswers,
      });

      console.log('Onboarding response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Response.data keys:', Object.keys(response?.data || {}));

      // Check if organization was created successfully
      if (response?.organization) {
        const newOrganization = response.organization;
        const newRole = response.role;

        // Create the organization object in the expected format
        const organizationToSelect = {
          id: newOrganization.id,
          name: newOrganization.name,
          status: newOrganization.status,
          enabledFeatures: newOrganization.enabledFeatures || [],
          billingEmail: newOrganization.billingEmail,
          contactEmail: newOrganization.contactEmail,
          companies: [], // Will be populated when companies are loaded
          role: {
            id: newRole.id,
            name: newRole.name,
            permissions: [], // You might need to fetch permissions separately
          },
        };

        // Clear companies array to ensure fresh start for new organization
        dispatch(clearCompanies());

        // Update the selected organization
        dispatch(setSelectedOrganization(organizationToSelect));

        // Update the user's role to match the new organization's role
        const updatedUser = {
          ...user,
          role: {
            id: newRole.id,
            key: newRole.key,
            name: newRole.name,
            permissions: [], // You might need to fetch permissions separately
          },
          selectedOrganization: organizationToSelect,
          // Add the new organization to the user's organizations list
          organizations: [
            {
              organization: newOrganization,
              role: newRole,
            },
          ],
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: organizationToSelect,
          })
        );

        // Set newUser to false after successful onboarding
        dispatch(setNewUserFalse());

        // Set cookie to indicate organization is selected
        document.cookie = 'has_selected_organization=true; path=/; SameSite=Lax; Secure';

        // Always redirect to company selection first, even if we have redirectTo
        // The company selection page will handle the redirectTo logic
        console.log('Organization created, redirecting to company selection');
        router.push('/company-selection');
      } else {
        throw new Error('No organization data received from server');
      }
    } catch (err: any) {
      console.error('Failed to submit onboarding form:', err);
      setError(err.message || 'Failed to submit onboarding form. Please try again.');
    }
  };

  const handleCreateOrganization = async () => {
    if (!businessName.trim()) {
      setError('Please enter a business name');
      return;
    }

    setError(null);

    try {
      await createOrganizationMutation.mutateAsync({ businessName });
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setError(err.message || 'Failed to create organization. Please try again.');
    }
  };

  const handleConnect = async () => {
    if (!selectedOrgId) {
      setError('Please select an organization to continue');
      return;
    }

    setError(null);

    try {
      const selectedOrg = user.organizations?.find((org) => org.organization.id === selectedOrgId);

      if (!selectedOrg) {
        throw new Error('Selected organization not found');
      }

      // Create the organization object in the expected format
      const organizationToSelect = {
        id: selectedOrg.organization.id,
        name: selectedOrg.organization.name,
        status: selectedOrg.organization.status,
        enabledFeatures: selectedOrg.organization.enabledFeatures || [],
        billingEmail: selectedOrg.organization.billingEmail,
        contactEmail: selectedOrg.organization.contactEmail,
        companies: [], // Will be populated when companies are loaded
        role: {
          id: selectedOrg.role.id,
          name: selectedOrg.role.name,
          permissions: [], // You might need to fetch permissions separately
        },
      };

      // Clear companies array to ensure fresh start for new organization
      dispatch(clearCompanies());

      // Update the selected organization
      dispatch(setSelectedOrganization(organizationToSelect));

      // Update the user's role to match the selected organization's role
      const updatedUser = {
        ...user,
        role: {
          id: selectedOrg.role.id,
          key: selectedOrg.role.key,
          name: selectedOrg.role.name,
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

      // Set cookie to indicate organization is selected
      document.cookie = 'has_selected_organization=true; path=/; SameSite=Lax; Secure';

      // Always redirect to company selection first, even if we have redirectTo
      // The company selection page will handle the redirectTo logic
      console.log('Organization selected, redirecting to company selection');
      router.push('/company-selection');
    } catch (err: any) {
      console.error('Error setting organization:', err);
      setError(err.message || 'Error setting organization');
    }
  };

  if (newUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
          <div className="mb-8 flex items-center">
            {isSelectedCompanyNull ? (
              <></>
            ) : (
              <button onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome to FinB</h2>
              <p className="text-gray-500 mb-6">Let's get to know your business better</p>
            </div>

            <div className="w-full max-w-md space-y-6">
              {/* Step indicator */}
              <div className="text-xs text-gray-500 mb-3">
                <span className="font-bold">{onboardingStep}</span>/4
              </div>

              {/* Step 1: Accounting Firm & Source */}
              {onboardingStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.isAccountingFirm}</Label>
                    <div className="flex flex-col space-y-2">
                      {['Yes', 'No'].map((option) => (
                        <div className="flex items-center gap-2" key={option}>
                          <input
                            type="radio"
                            id={`accounting-${option}`}
                            name="accountingFirm"
                            value={option}
                            checked={onboardingAnswers[onboardingQuestions.isAccountingFirm] === option}
                            onChange={(e) =>
                              setOnboardingAnswers((prev) => ({
                                ...prev,
                                [onboardingQuestions.isAccountingFirm]: e.target.value,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`accounting-${option}`} className="text-sm text-black">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.source}</Label>
                    <div className="flex flex-col space-y-2">
                      {sourceOptions.map((option) => (
                        <div className="flex items-center gap-2" key={option.id}>
                          <input
                            type="radio"
                            id={`source-${option.id}`}
                            name="source"
                            value={option.name}
                            checked={onboardingAnswers[onboardingQuestions.source] === option.name}
                            onChange={(e) =>
                              setOnboardingAnswers((prev) => ({
                                ...prev,
                                [onboardingQuestions.source]: e.target.value,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`source-${option.id}`} className="text-sm text-black">
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {onboardingAnswers[onboardingQuestions.source] === 'Other' && (
                      <Input
                        type="text"
                        placeholder="Please specify"
                        value={onboardingAnswers['sourceOther'] || ''}
                        onChange={(e) =>
                          setOnboardingAnswers((prev) => ({
                            ...prev,
                            sourceOther: e.target.value,
                          }))
                        }
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Time Spent & Sheets Familiarity */}
              {onboardingStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.timeSpent}</Label>
                    <div className="flex flex-col space-y-2">
                      {timeSpentOptions.map((option) => (
                        <div className="flex items-center gap-2" key={option.id}>
                          <input
                            type="radio"
                            id={`time-${option.id}`}
                            name="timeSpent"
                            value={option.name}
                            checked={onboardingAnswers[onboardingQuestions.timeSpent] === option.name}
                            onChange={(e) =>
                              setOnboardingAnswers((prev) => ({
                                ...prev,
                                [onboardingQuestions.timeSpent]: e.target.value,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`time-${option.id}`} className="text-sm text-black">
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.sheetsFamiliarity}</Label>
                    <div className="flex flex-col space-y-2">
                      {sheetsFamiliarityOptions.map((option) => (
                        <div className="flex items-center gap-2" key={option.id}>
                          <input
                            type="radio"
                            id={`sheets-${option.id}`}
                            name="sheetsFamiliarity"
                            value={option.name}
                            checked={onboardingAnswers[onboardingQuestions.sheetsFamiliarity] === option.name}
                            onChange={(e) =>
                              setOnboardingAnswers((prev) => ({
                                ...prev,
                                [onboardingQuestions.sheetsFamiliarity]: e.target.value,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`sheets-${option.id}`} className="text-sm text-black">
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Desired Outcome & Helpful */}
              {onboardingStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.desiredOutcome}</Label>
                    <textarea
                      className="w-full border border-gray-200 rounded-md p-3 text-sm h-24 resize-none"
                      placeholder="Please share your goals"
                      value={onboardingAnswers[onboardingQuestions.desiredOutcome] || ''}
                      onChange={(e) =>
                        setOnboardingAnswers((prev) => ({
                          ...prev,
                          [onboardingQuestions.desiredOutcome]: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-black">{onboardingQuestions.finboardHelpful}</Label>
                    <div className="flex flex-col space-y-2">
                      {finboardHelpfulOptions.map((option) => (
                        <div className="flex items-center gap-2" key={option.id}>
                          <input
                            type="radio"
                            id={`helpful-${option.id}`}
                            name="finboardHelpful"
                            value={option.name}
                            checked={onboardingAnswers[onboardingQuestions.finboardHelpful] === option.name}
                            onChange={(e) =>
                              setOnboardingAnswers((prev) => ({
                                ...prev,
                                [onboardingQuestions.finboardHelpful]: e.target.value,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`helpful-${option.id}`} className="text-sm text-black">
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Organization Name */}
              {onboardingStep === 4 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-black">{onboardingQuestions.organizationName}</Label>
                  <Input
                    type="text"
                    placeholder="Enter your organization name"
                    value={onboardingAnswers[onboardingQuestions.organizationName] || ''}
                    onChange={(e) =>
                      setOnboardingAnswers((prev) => ({
                        ...prev,
                        [onboardingQuestions.organizationName]: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500">We will use this name in all future communications with you.</p>
                </div>
              )}

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {onboardingStep > 1 && (
                  <Button onClick={handleOnboardingBack} variant="outline" className="flex-1">
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleOnboardingNext}
                  disabled={!isOnboardingStepValid() || onboardingFormMutation.isPending}
                  className="flex-1 text-white"
                >
                  {onboardingFormMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : onboardingStep === 4 ? (
                    'Submit'
                  ) : (
                    'Next'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
          <div className="mb-8 flex items-center">
            {isSelectedCompanyNull ? (
              <></>
            ) : (
              <button onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Create Your Organization</h2>
              <p className="text-gray-500 mb-6">Let's get started by setting up your business organization</p>
            </div>

            <div className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">What is your business name (Doing Business As, DBA)?</Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Enter your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">We will use this name in all future communications with you.</p>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                onClick={handleCreateOrganization}
                disabled={createOrganizationMutation.isPending || !businessName.trim()}
                className="w-full"
              >
                {createOrganizationMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-2xl rounded-lg border-[1.5px] border-gray-200 p-8">
        <div className="mb-8 flex items-center">
          {isSelectedCompanyNull ? (
            <></>
          ) : (
            <button onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Select Your Organization</h2>
            <p className="text-gray-500 mb-6">Choose the organization you want to work with</p>
          </div>

          <div className="w-full max-w-md">
            {!user.organizations ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="text-gray-500">Loading organizations...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                {user.organizations?.map((org) => (
                  <div
                    key={org.organization.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-md border ${
                      selectedOrgId === org.organization.id
                        ? 'border-[#4CAF50] ring-1 ring-[#4CAF50]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    } p-4`}
                    onClick={() => handleOrganizationSelect(org.organization.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{org.organization.name}</p>
                      </div>
                      <p className="text-sm text-gray-500">Role: {org.role.name}</p>
                      <p
                        className={`text-sm ${
                          org.organization.status === 'ACTIVE' ? 'text-[#4CAF50]' : 'text-red-500'
                        }`}
                      >
                        {org.organization.status}
                      </p>
                    </div>
                    {selectedOrgId === org.organization.id && (
                      <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-[#4CAF50]"></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div className="w-full py-6">
              <Button
                onClick={handleConnect}
                disabled={!selectedOrgId || createOrganizationMutation.isPending}
                className="w-full text-white"
              >
                {createOrganizationMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : selectedOrganization?.id === selectedOrgId ? (
                  'Continue'
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSelectionPage;
