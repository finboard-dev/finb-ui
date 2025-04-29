import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Router from 'next/router';
import { store } from '../store/store';

export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_CHAT,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  const excludedUrls = ['/auth/sso?provider=INTUIT', '/login'];

  axiosInstance.interceptors.request.use((config) => {
    if (excludedUrls.some((url) => config.url?.includes(url))) {
      config.baseURL = process.env.NEXT_PUBLIC_API_DEV;
      
      // For excluded URLs, remove any Authorization header
      if (config.headers) {
        delete config.headers.Authorization;
      }
      
      return config;
    }
    
    // For other URLs, add auth token from store
    if (config.headers && !excludedUrls.some(url => config.url?.includes(url))) {
      const token = store.getState().user.token?.accessToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Optional: Consider if you want to automatically redirect on missing token
        console.log('No bearer token found');
      }
    }
    
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.log('Unauthorized - redirecting to login');
        Router.push('/login'); // Redirect to /login on 401
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export const finBoardAxios = createAxiosInstance();

export const handleApiError = (error: any): never => {
  const message = error.response?.data?.message || 'Something went wrong';
  throw new Error(message);
};

export const response_body = (response: AxiosResponse) => response.data;

export const fetcher = {
  get: (url: string, params?: {}) =>
    finBoardAxios.get(url, { params }).then(response_body),
  post: (url: string, body: {}) =>
    finBoardAxios.post(url, body).then(response_body),
  put: (url: string, body: {}) =>
    finBoardAxios.put(url, body).then(response_body),
  delete: (url: string, body: {}) =>
    finBoardAxios.delete(url, { data: body }).then(response_body),
};

export const apiClient = {
  get: <T>(url: string, params?: {}) =>
    finBoardAxios.get<T>(url, { params }).then(response_body),
  post: <T>(url: string, body: {}) =>
    finBoardAxios.post<T>(url, body).then(response_body),
  put: <T>(url: string, body: {}) =>
    finBoardAxios.put<T>(url, body).then(response_body),
  delete: <T>(url: string, body: {}) =>
    finBoardAxios.delete<T>(url, { data: body }).then(response_body),
};