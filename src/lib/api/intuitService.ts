
import { ADD_APP, ADD_COMPANY, CSRF_TOKEN, REDIRECT_TYPE } from '@/constants';
import { fetcher } from '../axios/config';
import { store } from '@/lib/store/store';
import { setUserData } from '@/lib/store/slices/userSlice';
import { setCredentials } from '@/lib/store/slices/authSlice';

export const ssoLogin = async (state: string, authCode: string, realmId: string | null) => {
    try {
        const response = await fetcher.post(realmId != null ? `/qb/add_app` : `/auth/login`, {
            source: "QuickBooks",
            metadata: {
                auth_code: authCode,
                realm_id: realmId
            },
            sso_provider: "INTUIT"
        });

        const { token, user, code, message } = response;

        switch (code) {
            case 'LOGIN_SUCCESS':
                store.dispatch(setUserData({
                    token: {
                        accessToken: token.accessToken,
                        expiresIn: token.expiresIn,
                        tokenType: token.tokenType
                    },
                    user: user
                }));

                // Update auth slice
                store.dispatch(setCredentials({
                    bearerToken: token.accessToken,
                    currentCompanyId: user.organizations[0]?.companies[0]?.id || null
                }));

                return {
                    code,
                    message: 'Login successful'
                };

            case 'LOGIN_USER_NOT_VERIFIED':
                return {
                    code,
                    message,
                    redirectUrl: '/verify/quickbooks'
                };

            case 'LOGIN_FAILED':
                return {
                    code,
                    message
                };

            default:
                return {
                    code: 'LOGIN_ERROR',
                    message: 'Unknown response from server'
                };
        }
    } catch (error) {
        console.error("SSO login error:", error);
        return {
            code: 'LOGIN_ERROR',
            message: (error as any).response?.data?.message || 'An unexpected error occurred'
        };
    }
};

export const initAddQuickBookAccount = async () => {
    try {
        const response = await fetcher.get(`/qb/init_add_account`);
        const { state, redirect_url } = response;
        localStorage.setItem(CSRF_TOKEN, state);
        localStorage.setItem(REDIRECT_TYPE, ADD_COMPANY);
        return redirect_url;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const intuitSSOLogin = async (redirectType: string) => {
  try {
      const response = await fetcher.get('/auth/sso?provider=INTUIT');
      if (!response) {
          console.error('Invalid response from SSO login endpoint:', response);
          throw new Error('Invalid response from server');
      }
      const { state, redirect_url } = response;
      if (!state || !redirect_url) {
          console.error('Missing required fields in response:', response);
          throw new Error('Missing required authentication data');
      }
      localStorage.setItem(CSRF_TOKEN, state);
      localStorage.setItem(REDIRECT_TYPE, redirectType);
      console.log('Response from SSO login:', response);
      
      return response.redirect_url;
  } catch (error) {
      console.error('Failed to initiate QuickBooks login:', error);
      throw error;
  }
};

export const addQuickBookAccount = async (authCode: any, realmId: any) => {
    try {
        //check if token exists then add_account else add_app
        await fetcher.post('/qb/add_account', {
            code: authCode,
            realm_id: realmId
        });
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const getQuickBookAccountDetails = async (id: any) => {
    try {
        const response = await fetcher.get(`/qb/accounts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get QuickBook accounts:', error);
        throw error;
    }
};

export const getTemplateConfigFilter = async (id: any) => {
    try {
        const response = await fetcher.get(`/template/qb/filters/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get template config ', error);
        throw error;
    }
};

export const getAllTemplates = async (id: any) => {
    try {
        const response = await fetcher.get(`/template/qb/user/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get template config ', error);
        throw error;
    }
};

export const createNewDraft = async (id: any, version: any, data: any) => {
    try {
        const response = await fetcher.post(`/template/qb/add_source/${id}/${version}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to get template config ', error);
        throw error;
    }
};

export const syncAllDraftOfTemplate = async (id: any, version: any) => {
    try {
        const response = await fetcher.post(`/template/qb/sync/${id}/${version}`, {});
        return response.data;
    } catch (error) {
        console.error('Failed to get template config ', error);
        throw error;
    }
};

export const disconnectAccount = async (id: any) => {
    try {
        const response = await fetcher.post(`/qb/disconnect/${id}`, {});
        return response.data;
    } catch (error) {
        console.error('Failed to disconnect account ', error);
        throw error;
    }
};

export const initReconnectQuickBookAccount = async (id: any) => {
    try {
        const response = await fetcher.get(`/qb/reconnect/${id}`);
        const { state, redirect_url } = response.data;
        localStorage.setItem(CSRF_TOKEN, state);
        localStorage.setItem(REDIRECT_TYPE, ADD_COMPANY);
        return redirect_url;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const getAccounts = async () => {
    try {
        const response = await fetcher.get(`/account/all`);
        return response.data.data || [];
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const postToken = async (code: any) => {
    try {
        await fetcher.post(`/auth/tokens`, {
            auth_code: code
        });
    } catch (error) {
        console.error('Failed to post token:', error);
        throw error;
    }
};

export const getRedirectionUrlForNewApp = async () => {
    try {
        const response = await fetcher.get(`/auth/get_app_now`);
        localStorage.setItem(CSRF_TOKEN, response.data.state);
        localStorage.setItem(REDIRECT_TYPE, ADD_APP);
        return response.data;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};
//mapping/chart_of_accounts/

export const getChartOfAccounts = async (id: any) => {
    try {
        const response = await fetcher.get(`/mapping/chart_of_accounts/${id}`);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const getMappingForAccountByType = async (id: any, type: any) => {
    try {
        const response = await fetcher.get(`/mapping/${id}/${type}`);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const saveMappings = async (data: any) => {
    try {
        const response = await fetcher.post(`/mapping/save`, data);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const createNewGroup = async (data: any) => {
    try {
        const response = await fetcher.post(`/account/multi-entity/create`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const deleteGroup = async (id: any) => {
    try {
        const response = await fetcher.delete(`/account/multi-entity/delete?company_id=${id}`, {});
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const validateLoginToken = async (token: any) => {
    try {
        const response = await fetcher.get(`auth/validate_token?token=${token}`);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        const response = await fetcher.get(`user/profile`);
        return response;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        throw error;
    }
};

export const getAllSharedUsers = async () => {
    try {
        const response = await fetcher.get(`user/shared_users`);
        return response;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        throw error;
    }
};

export const addSharedUser = async (data: any) => {
    try {
        const response = await fetcher.post(`/user/add_shared_users`, data);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const deleteSharedUsers = async (data: any) => {
    try {
        const response = await fetcher.post(`/user/delete_shared_users`, data);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const getAddedAccountsWithPrivacyDetails = async () => {
    try {
        const response = await fetcher.get(`account/added`);
        return response;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        throw error;
    }
};

export const updatedCompanyPrivacyDetails = async (data: any) => {
    try {
        const response = await fetcher.post(`/account/bulk-update-access-level`, data);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const updateSharedUser = async (data: any) => {
    try {
        const response = await fetcher.post(`/user/update_shared_user`, data);
        return response;
    } catch (error) {
        console.error('Failed to add QuickBook account:', error);
        throw error;
    }
};

export const deleteSpreadsheet = async (id: any) => {
    try {
        const response = await fetcher.delete(`/template/qb/${id}`, {});
        return response;
    } catch (error) {
        console.error('Failed to delete spreadsheet:', error);
        throw error;
    }
};
