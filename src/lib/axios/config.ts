import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_CHAT,
    // timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = process.env.API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzc2NDMxODYtNTBjMS00OWM2LWFhOGMtOWE5OTk3ZjgwYzQ3IiwiaWF0IjoxNzQ1MjI2MTIyLCJleHAiOjE3NzA0MjYxMjIsImNyZWF0ZWRfYXQiOiIyMDI1LTA0LTIxVDA5OjAyOjAyLjM4NDM1MSswMDowMCJ9.CRYhKW0NlwI_1cRA6u7V1RNE9PI6NMIvNEfFYbIUtcE';
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.log('Unauthorized - redirecting to login');
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