import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { clearUserData, setUserData, setCompanies } from '@/lib/store/slices/userSlice';
import { sendMagicLink } from '@/lib/api/magicLink';
import { getCurrentCompany, getAllCompany } from '@/lib/api/allCompany';
import { fetcher } from '@/lib/axios/config';
import { setAuthCookies } from '@/lib/auth/tokenUtils';
import React from 'react';

interface MagicLinkAuthParams {
  token: string;
}

interface Token {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLoginTime: string;
  organizations?: any[];
  selectedCompany?: any;
  selectedOrganization?: any;
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
}

interface MagicLinkResponse {
  token: Token;
  user: User;
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
  success?: boolean;
  message?: string;
  error?: {
    message: string;
  };
}

export const useMagicLinkAuth = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hasRedirected = React.useRef(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const mutation = useMutation({
    mutationFn: async (params: MagicLinkAuthParams): Promise<void> => {
      const { token } = params;

      // Reset redirect flag
      hasRedirected.current = false;

      // Step 1: Clear state
      console.log('Step 1: Clearing Redux state...');
      dispatch(clearUserData());

      // Step 2: Execute magic link API
      console.log('Step 2: Executing magic link API...');
      const response: MagicLinkResponse = await sendMagicLink(token);

      if (!response || !response.token || !response.user) {
        throw new Error('Invalid magic link response');
      }

      // Step 3: Maintain state same as userSlice schema from the magic link API response
      console.log('Step 3: Setting user data in Redux...');
      console.log('Response data:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        selectedCompany: response.user.selectedCompany,
        selectedOrganization: response.user.selectedOrganization,
        organizations: response.user.organizations?.length || 0,
        redirectTo: response.user.redirectTo
      });
      
      // Transform selectedOrganization if it has nested structure
      let transformedSelectedOrganization = response.user.selectedOrganization;
      if (response.user.selectedOrganization?.organization) {
        // Extract the organization data from the nested structure
        const orgData = response.user.selectedOrganization.organization;
        const roleData = response.user.selectedOrganization.role;
        
        transformedSelectedOrganization = {
          id: orgData.id,
          name: orgData.name,
          status: orgData.status,
          enabledFeatures: orgData.enabledFeatures || [],
          billingEmail: orgData.billingEmail,
          contactEmail: orgData.contactEmail,
          companies: [],
          role: roleData,
        };
        console.log('Transformed organization data:', transformedSelectedOrganization);
        console.log('Original organization structure:', response.user.selectedOrganization);
        console.log('Extracted enabledFeatures:', orgData.enabledFeatures);
        console.log('Feature flags check:', {
          hasConsolidation: orgData.enabledFeatures?.includes('CONSOLIDATION'),
          hasReporting: orgData.enabledFeatures?.includes('REPORTING'),
          hasDashboard: orgData.enabledFeatures?.includes('DASHBOARD'),
          hasChat: orgData.enabledFeatures?.includes('FINB_AGENT'),
          hasComponents: orgData.enabledFeatures?.includes('COMPONENTS'),
        });
      }
      
      dispatch(
        setUserData({
          token: response.token,
          user: response.user,
          selectedOrganization: transformedSelectedOrganization,
          selectedCompany: response.user.selectedCompany,
        })
      );

      // Set auth cookie for middleware
      if (response.token?.accessToken) {
        console.log('Setting auth cookie for middleware...');
        setAuthCookies(response.token.accessToken);
      }

      // Set cookies for organization and company selection
      if (response.user.selectedOrganization) {
        document.cookie = 'has_selected_organization=true; path=/';
      }
      if (response.user.selectedCompany) {
        document.cookie = 'has_selected_company=true; path=/';
      }

      // Step 4: If selectedCompany exists, execute useCurrentCompany and useAllCompanies API calls
      if (response.user.selectedCompany?.id) {
        console.log('Step 4: Fetching company details...');
        try {
          // Get organization ID from the response
          const orgId = response.user.selectedOrganization?.organization?.id || 
                        response.user.organizations?.[0]?.organization?.id;
          
          console.log('Organization ID extraction:', {
            fromSelectedOrg: response.user.selectedOrganization?.organization?.id,
            fromOrganizations: response.user.organizations?.[0]?.organization?.id,
            finalOrgId: orgId
          });
          
          if (!orgId) {
            console.error('No organization ID found in response');
            throw new Error('No organization ID available');
          }

          // Fetch current company details
          const currentCompanyDetails = await getCurrentCompany(response.user.selectedCompany.id);
          
          // Fetch all companies for the organization using the orgId from response
          const allCompanies = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/company/all?orgId=${orgId}`);

          // Update the state with company details
          dispatch(
            setUserData({
              token: response.token,
              user: response.user,
              selectedOrganization: transformedSelectedOrganization, // Use the transformed version
              selectedCompany: currentCompanyDetails,
            })
          );

          // Set companies array
          dispatch(setCompanies(allCompanies));

          console.log('Company details fetched successfully');
        } catch (error) {
          console.error('Error fetching company details:', error);
          // Continue with the flow even if company fetch fails
        }
      } else {
        // Even if no selectedCompany, try to fetch companies for the organization
        console.log('Step 4: Fetching companies for organization...');
        try {
          const orgId = response.user.selectedOrganization?.organization?.id || 
                        response.user.organizations?.[0]?.organization?.id;
          
          if (orgId) {
            const allCompanies = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/company/all?orgId=${orgId}`);
            dispatch(setCompanies(allCompanies));
            console.log('Companies fetched successfully');
          }
        } catch (error) {
          console.error('Error fetching companies:', error);
          // Continue with the flow even if companies fetch fails
        }
      }

      // Step 5: Handle redirects based on organization and company selection
      if (!hasRedirected.current) {
        console.log('Step 5: Checking redirect conditions...');
        console.log('Redirect details:', {
          redirectTo: response.user.redirectTo,
          hasToken: !!response.token,
          hasUser: !!response.user,
          hasSelectedOrganization: !!response.user.selectedOrganization,
          hasSelectedCompany: !!response.user.selectedCompany,
          selectedCompany: response.user.selectedCompany?.id
        });
        
        hasRedirected.current = true;
        setIsRedirecting(true);
        
        // Determine where to redirect based on selection status
        let redirectPath = response.user.redirectTo;
        
        if (!response.user.selectedOrganization) {
          // No organization selected - go to organization selection
          console.log('No organization selected, redirecting to organization selection');
          redirectPath = '/organization-selection';
        } else if (!response.user.selectedCompany) {
          // No company selected - go to company selection
          console.log('No company selected, redirecting to company selection');
          redirectPath = '/company-selection';
        }
        
        console.log('Final redirect path:', redirectPath);
        
        // Add a small delay to ensure all state updates are complete
        setTimeout(() => {
          console.log('Executing redirect to:', redirectPath);
          console.log('Checking auth cookie...');
          
          // Check if auth cookie is set
          const authCookie = document.cookie.includes('auth_token=');
          console.log('Auth cookie present:', authCookie);
          
          // Check current URL and pathname
          console.log('Current URL:', window.location.href);
          console.log('Current pathname:', window.location.pathname);
          
          if (redirectPath) {
            try {
              console.log('Attempting router.push to:', redirectPath);
              router.push(redirectPath);
              console.log('Router.push executed successfully');
              
              // Double-check if the redirect actually happened
              setTimeout(() => {
                console.log('After router.push - Current pathname:', window.location.pathname);
                if (redirectPath && window.location.pathname !== redirectPath) {
                  console.log('Router.push failed, trying window.location.href');
                  window.location.href = redirectPath;
                } else {
                  // Clear redirectTo from state after successful redirect (only if it was the original redirectTo)
                  if (redirectPath === response.user.redirectTo) {
                    console.log('Redirect successful, clearing redirectTo from state');
                    dispatch(
                      setUserData({
                        token: response.token,
                        user: { ...response.user, redirectTo: undefined },
                        selectedOrganization: transformedSelectedOrganization,
                        selectedCompany: response.user.selectedCompany,
                      })
                    );
                  }
                  setIsRedirecting(false);
                }
              }, 100);
            } catch (error) {
              console.error('Router.push failed, trying window.location:', error);
              window.location.href = redirectPath;
              
              // Clear redirectTo from state even if using window.location.href (only if it was the original redirectTo)
              if (redirectPath === response.user.redirectTo) {
                setTimeout(() => {
                  console.log('Window.location redirect, clearing redirectTo from state');
                  dispatch(
                    setUserData({
                      token: response.token,
                      user: { ...response.user, redirectTo: undefined },
                      selectedOrganization: transformedSelectedOrganization,
                      selectedCompany: response.user.selectedCompany,
                    })
                  );
                  setIsRedirecting(false);
                }, 100);
              } else {
                setIsRedirecting(false);
              }
            }
          }
        }, 200); // Increased delay to ensure cookie is set
      } else {
        console.log('Already redirected or no redirect path provided');
      }
    },
    onError: (error) => {
      console.error('Magic link authentication error:', error);
      setIsRedirecting(false);
    },
  });

  return {
    ...mutation,
    isRedirecting,
  };
}; 