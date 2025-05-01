import { store } from '../store/store';
import { userBearerToken } from '../store/slices/userSlice';


export const getAuthToken = (): string | undefined  | null => {
  return store.getState().user.token?.accessToken;
};


export const getBearerToken = (): string | undefined => {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : undefined;
};


export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getAndClearRedirectPath = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const path = sessionStorage.getItem('redirectAfterLogin');
  if (path) {
    sessionStorage.removeItem('redirectAfterLogin');
  }
  return path;
};