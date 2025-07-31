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
    selectedCompany?: any;
    selectedOrganization?: any;
    newUser?: boolean;
    redirectTo?: string;
    pluginInstalled?: boolean;
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
        
        console.log('Login response - user data:', {
          newUser: user.newUser,
          organizations: user.organizations?.length || 0,
          selectedCompany: user.selectedCompany,
          selectedOrganization: user.selectedOrganization
        });
        
        // Simply set the user data and let the OAuth callback handle redirects
        const userData = {
          token: response.token,
          user: user,
        };
        dispatch(setUserData(userData));
        
        // Don't handle redirects here - let the OAuth callback page handle it
        console.log('User data set in Redux, redirect will be handled by OAuth callback');
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