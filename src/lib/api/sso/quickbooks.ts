import { IS_GOOGLE_CONNECTED, USER } from "@/constants";
import { fetcher } from "@/lib/axios/config";

export const ssoLogin = async (state: any, authCode: any, realmId: null) => {
  try {
    const response = await fetcher.post(realmId != null ? `/qb/add_app` : `/qb/add_user`, {
      state: state,
      code: authCode,
      realm_id: realmId
    });
    
    const { access_token, code, user, is_google_connected = false, message } = response;
    
    if (code === 'LOGIN_FAILED') {
      return { code, message };
    }
    
    if (code === 'LOGIN_USER_NOT_VERIFIED') {
      return { code, message, redirectUrl: '/verify/quickbooks' };
    }
    
    if (code === 'LOGIN_SUCCESS') {
      // Store data in localStorage
      window.localStorage.setItem(IS_GOOGLE_CONNECTED, is_google_connected);
      window.localStorage.setItem(USER, JSON.stringify(user));
      
      return { code, message, user };
    }
    
    return response;
  } catch (error) {
    console.error("SSO login error:", error);
    return { 
      code: 'LOGIN_ERROR', 
      message: (error as any).response?.data?.message || 'An unexpected error occurred'
    };
  }
};