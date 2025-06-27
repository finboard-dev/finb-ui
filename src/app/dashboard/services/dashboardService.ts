import { getDashboardStructure, getWidgetData } from '@/lib/api/dashboard';
import { 
  DashboardStructure, 
  WidgetDataRequest, 
  WidgetData,
  DashboardStructureResponse,
  WidgetDataResponse 
} from '../types';

export class DashboardService {
  private static instance: DashboardService;
  private cache: Map<string, any> = new Map();

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Fetch dashboard structure
   */
  async fetchDashboardStructure(): Promise<DashboardStructure> {
    try {
      console.log('Fetching dashboard structure...');

      const response = await getDashboardStructure();
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid dashboard structure response');
      }

      const dashboardStructure = response.data as DashboardStructure;
      
      // Cache the dashboard structure
      this.cache.set('dashboard_structure', dashboardStructure);
      
      console.log('Dashboard structure fetched successfully');
      return dashboardStructure;
    } catch (error) {
      console.error('Error fetching dashboard structure:', error);
      throw new Error(`Failed to fetch dashboard structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch widget data for a specific component
   */
  async fetchWidgetData(
    dashboardId: string, 
    componentId: string, 
    tabId: string, 
    filter: Record<string, any> = {}
  ): Promise<WidgetData> {
    const request: WidgetDataRequest = {
      dashboardId,
      componentId,
      tabId,
      filter
    };

    try {
      console.log(`Fetching widget data for ${componentId}:`, request);

      const response = await getWidgetData(request);
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid widget data response');
      }

      // Extract the nested data property from the response
      const widgetData = response.data as WidgetData;
      
      // Cache the widget data
      const cacheKey = `${dashboardId}_${componentId}_${tabId}`;
      this.cache.set(cacheKey, widgetData);
      
      return widgetData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Widget data fetch for ${componentId} was cancelled`);
        throw error;
      }
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error(`Error fetching widget data for ${componentId}:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          request: request
        });
      } else {
        console.error(`Error fetching widget data for ${componentId}:`, error);
      }
      
      throw new Error(`Failed to fetch widget data for ${componentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch all widget data for a specific tab
   */
  async fetchTabWidgetData(
    dashboardId: string, 
    tabId: string, 
    widgets: Array<{ component_id: string; filter: Record<string, any> }>
  ): Promise<Record<string, WidgetData>> {
    try {
      console.log(`Fetching widget data for tab ${tabId} with ${widgets.length} widgets`);
      
      const widgetDataPromises = widgets.map(async (widget) => {
        try {
          const data = await this.fetchWidgetData(dashboardId, widget.component_id, tabId, widget.filter);
          return { componentId: widget.component_id, data, success: true };
        } catch (error) {
          console.error(`Failed to fetch data for widget ${widget.component_id}:`, error);
          return { componentId: widget.component_id, data: null, success: false, error };
        }
      });

      const results = await Promise.allSettled(widgetDataPromises);
      
      const widgetData: Record<string, WidgetData> = {};
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          widgetData[result.value.componentId] = result.value.data;
          successCount++;
        } else {
          errorCount++;
        }
      });

      console.log(`Widget data fetch completed: ${successCount} successful, ${errorCount} failed`);
      
      return widgetData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Tab widget data fetch for ${tabId} was cancelled`);
        throw error;
      }
      
      console.error(`Error fetching tab widget data for ${tabId}:`, error);
      throw new Error(`Failed to fetch tab widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cached dashboard structure
   */
  getCachedDashboardStructure(): DashboardStructure | null {
    return this.cache.get('dashboard_structure') || null;
  }

  /**
   * Get cached widget data
   */
  getCachedWidgetData(dashboardId: string, componentId: string, tabId: string): WidgetData | null {
    const cacheKey = `${dashboardId}_${componentId}_${tabId}`;
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Dashboard cache cleared');
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance(); 