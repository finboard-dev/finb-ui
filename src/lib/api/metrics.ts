import { fetcher } from "../axios/config"

interface PublishComponentMetricsRequest {
  title: string;
  metricScope: "Global" | "Organization" | "Company";
  orgId?: string;
  companyId?: string;
}

interface PublishComponentMetricsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface GetComponentMetricsParams {
  orgId: string;
  companyId: string;
  publishedOnly?: boolean;
}

// New simplified types for the updated API response
interface ComponentMetric {
  refId: string;
  title: string;
  description: string | null;
  companyId: string | null;
  orgId: string | null;
  refVersion: string;
  refType: string;
  output: string;
  scopeLevel: "Global" | "Organization" | "Company";
  createdAt: string;
  updatedAt: string;
}

interface GetComponentMetricsResponse {
  success: boolean;
  message?: string;
  data?: ComponentMetric[];
}

export const publishComponentMetrics = async (
  componentId: string,
  data: PublishComponentMetricsRequest
): Promise<PublishComponentMetricsResponse> => {
  if (!componentId) {
    throw new Error('Component ID is required');
  }

  if (!data.title || !data.metricScope) {
    throw new Error('Title and metricScope are required');
  }

  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/component/metrics/${componentId}/publish`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error publishing component metrics:', error);
    throw error;
  }
};

export const getComponentMetrics = async (
  params: GetComponentMetricsParams
): Promise<GetComponentMetricsResponse> => {
  const { orgId, companyId, publishedOnly = true } = params;

  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  if (!companyId) {
    throw new Error('Company ID is required');
  }

  try {
    const response = await fetcher.get(
      `${process.env.NEXT_PUBLIC_API_DEV}/component/metrics/org/${orgId}/company/${companyId}?publishedOnly=true`,
    );
    
    console.log('Raw API response:', response);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      // If response is directly an array, wrap it in the expected format
      return {
        success: true,
        data: response
      };
    } else if (response && typeof response === 'object') {
      // If response has data property, use it
      if (response.data !== undefined) {
        return {
          success: true,
          data: response.data
        };
      }
      // If response is the data itself
      return {
        success: true,
        data: response
      };
    }
    
    // Fallback
    return {
      success: false,
      message: 'Unexpected response format',
      data: []
    };
  } catch (error: any) {
    // Handle cancellation errors specifically
    if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled' || error?.message?.includes('canceled')) {
      console.log('Component metrics request was canceled - this is normal behavior');
      throw error; // Re-throw the canceled error as-is
    }
    
    // Handle network errors
    if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
      console.error('Network error fetching component metrics:', error);
      throw new Error('Network error: Unable to connect to the server');
    }
    
    // Handle HTTP errors
    if (error?.response?.status) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if (status === 403) {
        throw new Error('Forbidden: You do not have permission to access this resource');
      } else if (status === 404) {
        throw new Error('Not found: The requested resource was not found');
      } else if (status >= 500) {
        throw new Error('Server error: Please try again later');
      } else {
        throw new Error(`HTTP error ${status}: ${error.response.data?.message || 'Unknown error'}`);
      }
    }
    
    console.error('Error fetching component metrics:', error);
    throw new Error('Failed to fetch component metrics');
  }
};

