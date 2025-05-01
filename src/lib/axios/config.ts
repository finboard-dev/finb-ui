import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_CONFIG } from '../auth/authConfig';
import { getBearerToken } from '../store/tokenUtils';


export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_CHAT,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (AUTH_CONFIG.devApiWithAuthEndpoints.some((url) => config.url?.includes(url))) {
      config.baseURL = process.env.NEXT_PUBLIC_API_DEV;
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    if (AUTH_CONFIG.devApiWithAuthEndpoints.some((url) => config.url?.includes(url))) {
      config.baseURL = process.env.NEXT_PUBLIC_API_DEV;
    }

    if (config.headers) {
      const token = getBearerToken();
      if (token) {
        config.headers.Authorization = token;
      } else if (typeof window !== 'undefined' && !window.location.pathname.includes(AUTH_CONFIG.loginPath)) {
        console.log('No bearer token found - redirecting to login');
        sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
        window.location.href = AUTH_CONFIG.loginPath;
      }
    }

    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        console.log('Unauthorized - redirecting to login');
        sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
        window.location.href = AUTH_CONFIG.loginPath;
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export const apiClient = createAxiosInstance();

export const response_body = (response: AxiosResponse) => response.data;

export const fetcher = {
  get: (url: string, params?: object) =>
    apiClient.get(url, { params }).then(response_body),
  post: (url: string, body: object) =>
    apiClient.post(url, body).then(response_body),
  put: (url: string, body: object) =>
    apiClient.put(url, body).then(response_body),
  delete: (url: string, body?: object) =>
    apiClient.delete(url, { data: body }).then(response_body),
};

export const handleApiError = (error: any): never => {
  const message = error.response?.data?.message || 'Something went wrong';
  throw new Error(message);
};