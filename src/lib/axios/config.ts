import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_CONFIG } from '../auth/authConfig';
import { getBearerToken } from '../store/tokenUtils';
import { store } from "@/lib/store/store";

const organisation: any = store.getState().user.selectedOrganization;
const organisation_id = organisation?.id;

const pendingRequests = new Map();

export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_CHAT,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': "69420"
    },
    ...config,
  });

  axiosInstance.interceptors.request.use((config) => {
    const requestId = `${config.method}:${config.url}`;

    if (pendingRequests.has(requestId)) {
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort('Duplicate request canceled');
      return config;
    }

    pendingRequests.set(requestId, true);

    if (AUTH_CONFIG.devApiWithAuthEndpoints.some((url) => config.url?.includes(url))) {
      config.baseURL = process.env.NEXT_PUBLIC_API_DEV;
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    if (AUTH_CONFIG.privateDevApiEndpoints.some((url) => config.url?.includes(url))) {
      config.baseURL = process.env.NEXT_PUBLIC_API_DEV;
    }

    if (config.headers) {
      if (AUTH_CONFIG.organizationIdInHeaders.some((url) => config.url?.includes(url))) {
        config.headers["x-org-id"] = organisation_id;
      }

      const token = getBearerToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (typeof window !== 'undefined' && !window.location.pathname.includes(AUTH_CONFIG.loginPath)) {
        console.log('No bearer token found - redirecting to login');
        sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
        window.location.href = AUTH_CONFIG.loginPath;
      }
    }

    return config;
  });

  axiosInstance.interceptors.response.use(
      (response) => {
        const requestId = `${response.config.method}:${response.config.url}`;
        pendingRequests.delete(requestId);
        return response;
      },
      (error) => {
        if (error.config) {
          const requestId = `${error.config.method}:${error.config.url}`;
          pendingRequests.delete(requestId);
        }

        // Handle 401 errors
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          console.log('Unauthorized - redirecting to login');
          sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
          // window.location.href = AUTH_CONFIG.loginPath;
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