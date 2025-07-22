import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_CONFIG } from '../auth/authConfig';
import { getBearerToken } from '../store/tokenUtils';
import { store } from "@/lib/store/store";

const pendingRequests = new Map();

export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_CHAT,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': "69420",
    },
    ...config,
  });

  axiosInstance.interceptors.request.use((config) => {
    const state = store.getState();
    const organisation = state.user.selectedOrganization;
    const organisation_id = organisation?.id;

    const token = state.user.token?.accessToken;

    // Create unique request ID including body for POST requests
    let requestId = `${config.method}:${config.url}`;
    if (config.method === 'post' && config.data) {
      // For widget data requests, include componentId and tabId in the request ID
      try {
        const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        if (data.componentId && data.tabId) {
          requestId += `:${data.componentId}:${data.tabId}`;
        } else {
          // For other POST requests, include a hash of the data
          requestId += `:${JSON.stringify(config.data)}`;
        }
      } catch (e) {
        // If parsing fails, use the original requestId
      }
    }

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

      config.headers["ngrok-skip-browser-warning"] = "true"
      config.headers["x-org-id"] = organisation_id;

      const isPublicEndpoint = AUTH_CONFIG.publicApiEndpoints.some(
          (url) => config.url?.includes(url)
      );

      if (token && !isPublicEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (!token && !isPublicEndpoint && typeof window !== 'undefined' &&
          !window.location.pathname.includes(AUTH_CONFIG.loginPath)) {
        console.log('No bearer token found - redirecting to login');
        sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
        window.location.href = AUTH_CONFIG.loginPath;
      }
    }

    return config;
  });



  axiosInstance.interceptors.response.use(
      (response) => {
        // Create unique request ID including body for POST requests
        let requestId = `${response.config.method}:${response.config.url}`;
        if (response.config.method === 'post' && response.config.data) {
          try {
            const data = typeof response.config.data === 'string' ? JSON.parse(response.config.data) : response.config.data;
            if (data.componentId && data.tabId) {
              requestId += `:${data.componentId}:${data.tabId}`;
            } else {
              requestId += `:${JSON.stringify(response.config.data)}`;
            }
          } catch (e) {
            // If parsing fails, use the original requestId
          }
        }
        pendingRequests.delete(requestId);
        return response;
      },
      (error) => {
        if (error.config) {
          // Create unique request ID including body for POST requests
          let requestId = `${error.config.method}:${error.config.url}`;
          if (error.config.method === 'post' && error.config.data) {
            try {
              const data = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
              if (data.componentId && data.tabId) {
                requestId += `:${data.componentId}:${data.tabId}`;
              } else {
                requestId += `:${JSON.stringify(error.config.data)}`;
              }
            } catch (e) {
              // If parsing fails, use the original requestId
            }
          }
          pendingRequests.delete(requestId);
        }
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          console.log('Unauthorized - redirecting to login');
          sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, window.location.pathname);
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