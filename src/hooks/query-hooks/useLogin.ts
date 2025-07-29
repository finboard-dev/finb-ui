import { useMutation } from '@tanstack/react-query';
import { quickbooksService } from '@/lib/api/sso/quickbooks';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUserData } from '@/lib/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { setAuthCookies } from '@/lib/auth/tokenUtils';

interface LoginParams {
  code: string;
}

interface LoginResponse {
  token?: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    lastLoginTime: string;
    organizations: Array<{
      organization: {
        id: string;
        name: string;
        status: string;
        enabledFeatures?: string[];
        billingEmail?: string;
        contactEmail?: string;
      };
      role: {
        id: string;
        key: string;
        name: string;
      };
    }>;
  };
  code?: string;
  message?: string;
  error?: {
    message: string;
  };
}

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: LoginParams): Promise<LoginResponse> => {
      const response = await quickbooksService.ssoLogin(params.code, null);
      return response;
    },
    onSuccess: (response) => {
      if (response && response.token && response.user) {
        // Set auth cookies
        setAuthCookies(response.token.accessToken);
        
        const user = response.user;
        const organizations = user.organizations || [];
        
        console.log('Login response - organizations count:', organizations.length);
        console.log('Organizations:', organizations);
        
        if (organizations.length === 0) {
          // No organizations - redirect to organization-selection for creation
          const userData = {
            token: response.token,
            user: user,
          };
          dispatch(setUserData(userData));
          router.push('/organization-selection');
        } else if (organizations.length === 1) {
          // Single organization - auto-select it
          const org = organizations[0];
          const organizationToSelect = {
            id: org.organization.id,
            name: org.organization.name,
            status: org.organization.status,
            enabledFeatures: org.organization.enabledFeatures || [],
            billingEmail: org.organization.billingEmail,
            contactEmail: org.organization.contactEmail,
            companies: [],
            role: {
              id: org.role.id,
              name: org.role.name,
              permissions: [],
            },
          };

          const updatedUser = {
            ...user,
            role: {
              id: org.role.id,
              key: org.role.key,
              name: org.role.name,
              permissions: [],
            },
            selectedOrganization: organizationToSelect,
          };

          const userData = {
            token: response.token,
            user: updatedUser,
            selectedOrganization: organizationToSelect,
          };
          
          dispatch(setUserData(userData));
          
          // Set organization cookie for auto-selected organization
          document.cookie = 'has_selected_organization=true; path=/; SameSite=Lax; Secure';
          
          // Redirect to company-selection
          router.push('/company-selection');
        } else {
          // Multiple organizations - redirect to organization-selection for choice
          const userData = {
            token: response.token,
            user: user,
          };
          dispatch(setUserData(userData));
          
          // Redirect to organization-selection for choice
          router.push('/organization-selection');
        }
      } else {
        throw new Error(response?.error?.message || 'Invalid response from authentication server.');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      throw error;
    },
  });
}; 