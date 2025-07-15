import { fetcher } from "../axios/config"
import { store } from "../store/store";
import { getCompanyId, getOrgId } from "../utils/helpers";

export const getDashboardStructure = async (dashboardId: string) => {
  if (!dashboardId) {
    throw new Error('Dashboard ID is required');
  }
  
  
  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/dashboard/?dashboard=${dashboardId}`)
    console.log(response)
    return response.data
  } catch (error) {
    // Fallback to mock data for development
    console.warn('API not available, using mock data:', error);
    return {
      uid: dashboardId,
      title: `${dashboardId} Dashboard`,
      view_only: false,
      links: [],
      tabs: [
        {
          id: 'tab-1',
          title: 'Overview',
          widgets: [
            {
              id: 'widget-1',
              component_id: 'metric-1',
              title: 'Total Revenue',
              type: 'metric',
              filter: {},
              position: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
              data: { value: '$125,000', change: '+12%', trend: 'up' }
            },
            {
              id: 'widget-2',
              component_id: 'chart-1',
              title: 'Revenue Trend',
              type: 'graph',
              filter: {},
              position: { x: 3, y: 0, w: 6, h: 4, minW: 4, minH: 2 },
              data: JSON.stringify({
                type: 'line',
                data: {
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Revenue',
                    data: [10000, 15000, 12000, 18000, 20000, 25000],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  }]
                }
              })
            }
          ]
        }
      ]
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
    return response.data;
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
    
    return response;
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
  const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/dashboard/all?companyId=${getCompanyId()}&orgId=${getOrgId()}`);
  return response;
}