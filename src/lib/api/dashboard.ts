import { fetcher } from "../axios/config"
import { store } from "../store/store";
import { getCompanyId, getOrgId } from "../utils/helpers";
import { DashboardApiResponse, DashboardVersion } from "@/app/dashboard/types";

export const getDashboardStructure = async (dashboardId: string): Promise<DashboardApiResponse> => {
  if (!dashboardId) {
    throw new Error('Dashboard ID is required');
  }
  
  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/dashboard/${dashboardId}`)
    
    // The API returns the data directly, not wrapped in a data property
    const data = response.data || response;
    
    if (!data) {
      console.error('Response data is null or undefined');
      throw new Error('No data received from dashboard API');
    }
    
    return data;
  } catch (error: any) {
    // Check for specific "No value present" error (500 status)
    if (error?.response?.status === 500 && 
        error?.response?.data?.detail?.message === "No value present") {
      console.log('Dashboard not found - "No value present" error detected');
      throw new Error('Dashboard not found - No value present');
    }
    
    // Check for 404 errors
    if (error?.response?.status === 404) {
      console.log('Dashboard not found - 404 error detected');
      throw new Error('Dashboard not found - 404');
    }
    
    // Fallback to mock data for development (only for network errors, not for "not found" errors)
    if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
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
    
    // Re-throw other errors
    throw error;
  }
}

interface WidgetDataFilter {
  period?: string;
  category?: string;
  breakdown?: string;
  [key: string]: any;
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
    console.log('Making API call to create dashboard...');
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/`,
      {
        ...dashboardData,
        companyId,
        orgId
      }
    );
    console.log('API call completed successfully');
    
    console.log('Dashboard creation response:', response);
    
    // The fetcher.post already returns response.data, so response is the actual data
    const data = response;
    
    console.log('Processed data:', data);
    console.log('Data type:', typeof data);
    console.log('Data keys:', data ? Object.keys(data) : 'null/undefined');
    
    // Check if response has the expected structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from server');
    }
    
    // Validate that we have the expected fields
    if (!data.id) {
      console.error('Response missing required fields:', data);
      throw new Error('Invalid response structure - missing dashboard ID');
    }
    
    console.log('Returning data successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error creating dashboard:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Re-throw the original error if it's already an Error object
    if (error instanceof Error) {
      throw error;
    }
    
    // Otherwise, create a generic error
    throw new Error('Failed to create dashboard');
  }
}

export const getDashboards = async (): Promise<Dashboard[]> => {
  
  const url = `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/all?companyId=${getCompanyId()}&orgId=${getOrgId()}`;
  
  const response = await fetcher.get(url);
  
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

export interface SaveDashboardRequest {
  id: string;
  dashboardId: string;
  tabs: Array<{
    id: string;
    title: string;
    position: number;
    startDate: string;
    endDate: string;
    widgets: Array<{
      id: string;
      title: string;
      position: {
        x: number;
        y: number;
        w: number;
        h: number;
        min_w: number;
        min_h: number;
      };
      refId: string;
      refVersion: string;
      refType: string;
      outputType: string;
    }>;
  }>;
}

export const saveDashboard = async (dashboardData: SaveDashboardRequest): Promise<any> => {
  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/save`,
      dashboardData
    );
    return response.data || response;
  } catch (error) {
    console.error('Error saving dashboard:', error);
    throw new Error('Failed to save dashboard');
  }
}

// Component Execution API
export interface ComponentExecuteRequest {
  refId: string;
  refVersion: string;
  refType: string;
  startDate: string;
  endDate: string;
  companyId: string;
}

export interface ComponentExecuteResponse {
  executionId: string;
  output: string;
  outputType: string;
  executionTimeMs: number;
  executedAt: string;
  error: string | null;
}

export const executeComponent = async (params: ComponentExecuteRequest): Promise<ComponentExecuteResponse> => {
  if (!params.refId || !params.refVersion || !params.refType || !params.companyId) {
    throw new Error('Missing required parameters for component execution');
  }

  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/component/execute`,
      params
    );
    return response.data || response;
  } catch (error: any) {
    // Check if it's a canceled request
    if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
      console.log('Component execution request was canceled - this is normal behavior');
      throw error; // Re-throw the canceled error as-is
    }
    
    console.error('Error executing component:', error);
    throw new Error('Failed to execute component');
  }
}