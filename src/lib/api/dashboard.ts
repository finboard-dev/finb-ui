import { fetcher } from "../axios/config"
import { store } from "../store/store";
import { getCompanyId, getOrgId } from "../utils/helpers";
import { DashboardApiResponse, DashboardVersion } from "@/app/dashboard/types";

export const getDashboardStructure = async (dashboardId: string): Promise<DashboardApiResponse> => {
  if (!dashboardId) {
    throw new Error('Dashboard ID is required');
  }
  
  console.log('Fetching dashboard structure for ID:', dashboardId);
  console.log('API URL:', `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/?dashboard=${dashboardId}`);
  
  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/dashboard/${dashboardId}`)
    console.log('Dashboard API response:', response);
    console.log('Dashboard API response data:', response.data);
    
    // The API returns the data directly, not wrapped in a data property
    const data = response.data || response;
    
    if (!data) {
      console.error('Response data is null or undefined');
      throw new Error('No data received from dashboard API');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard structure:', error);
    
    // Fallback to mock data for development
    console.warn('API not available, using mock data:', error);
    return {
      id: dashboardId,
      title: "Mock Dashboard", // Added title for mock data
      sharedUsers: [],
      createdAt: new Date().toISOString(),
      createdBy: {
        id: "mock-user-id",
        name: "Mock User",
        email: "mock@example.com"
      },
      publishedVersion: null,
      draftVersion: {
        id: "mock-draft-id",
        dashboardId: dashboardId,
        tabs: [
          {
            id: 'tab-1',
            title: 'tab error',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            position: 0,
            lastRefreshedAt: null,
            widgets: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com"
        },
        updatedBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com"
        }
      },
      orgId: "mock-org-id",
      companyId: "mock-company-id",
      updatedAt: new Date().toISOString()
    };
  }
}

interface WidgetDataFilter {
  period?: string;
  category?: string;
  breakdown?: string;
  [key: string]: any;
}

interface WidgetDataRequest {
  dashboardId: string;
  componentId: string;
  tabId: string;
  filter: WidgetDataFilter;
}

export const getWidgetData = async (params: WidgetDataRequest) => {
  if (!params.dashboardId) {
    throw new Error('Dashboard ID is required');
  }

  
  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/widget-data`,
      params
    );
    return response.data || response;
  } catch (error) {
    // Fallback to mock data for development
    console.warn('Widget data API not available, using mock data:', error);
    return {
      value: '$125,000',
      change: '+12%',
      trend: 'up',
      timestamp: new Date().toISOString()
    };
  }
}

export interface CreateDashboardRequest {
  title: string;
  startDate: string;
  endDate: string;
  companyId: string;
  orgId: string;
}

export interface CreateDashboardResponse {
  id: string;
  title: string;
  sharedUsers: any[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedVersionId: string | null;
  draftVersionId: string;
  orgId: string;
  companyId: string;
}

export interface Dashboard {
  id: string;
  title: string;
  sharedUsers: any[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedVersionId: string | null;
  draftVersionId: string;
  orgId: string;
  companyId: string;
}

export const createDashboard = async (dashboardData: any): Promise<CreateDashboardResponse> => {
  const companyId = getCompanyId();
  const orgId = getOrgId();
  
  console.log('Creating dashboard with data:', { ...dashboardData, companyId, orgId });
  
  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/`,
      {
        ...dashboardData,
        companyId,
        orgId
      }
    );
    
    console.log('Dashboard creation response:', response);
    
    // Check if response has the expected structure
    if (!response || typeof response !== 'object') {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid response from server');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating dashboard:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error('Failed to create dashboard');
  }
}

export const getDashboards = async (): Promise<Dashboard[]> => {
  console.log('getDashboards - Starting API call');
  console.log('getDashboards - Company ID:', getCompanyId());
  console.log('getDashboards - Org ID:', getOrgId());
  
  const url = `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/all?companyId=${getCompanyId()}&orgId=${getOrgId()}`;
  console.log('getDashboards - API URL:', url);
  
  const response = await fetcher.get(url);
  console.log('getDashboards - API response:', response);
  console.log('getDashboards - API response data:', response.data);
  
  // The API returns the data directly, not wrapped in a data property
  return response.data || response;
}

export const saveDraft = async (dashboardId: string, draftData: any): Promise<DashboardVersion> => {
  try {
    const response = await fetcher.put(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/${dashboardId}/draft`,
      draftData
    );
    return response.data || response;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Failed to save draft');
  }
}

export const publishDraft = async (dashboardId: string): Promise<DashboardVersion> => {
  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/${dashboardId}/publish`,
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error publishing draft:', error);
    throw new Error('Failed to publish draft');
  }
}