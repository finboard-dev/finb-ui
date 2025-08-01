import { getDashboardStructure, saveDraft, publishDraft } from '@/lib/api/dashboard';
import { 
  DashboardStructure, 
  WidgetData,
  DashboardStructureResponse,
  WidgetDataResponse,
  DashboardApiResponse,
  DashboardVersion
} from '../types';
import { monitorApiCall } from '../utils/apiMonitor';

export class DashboardService {
  private static instance: DashboardService;
  private cache: Map<string, any> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private requestTimestamps: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  /**
   * Check rate limit for requests
   */
  private async checkRateLimit(key: string): Promise<void> {
    const lastRequest = this.requestTimestamps.get(key);
    const now = Date.now();
    
    if (lastRequest && (now - lastRequest) < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - (now - lastRequest);
      console.log(`Rate limiting request for ${key}, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.requestTimestamps.set(key, now);
  }

  /**
   * Set cache with expiry
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get cached data if valid
   */
  private getValidCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key) || null;
    }
    // Remove expired cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  /**
   * Transform API response to DashboardStructure format
   */
  private transformApiResponse(apiResponse: DashboardApiResponse): DashboardStructure {
    console.log('Transforming API response:', apiResponse);
    
    const { publishedVersion, draftVersion } = apiResponse;
    
    // Determine which version to use based on availability
    let currentVersion: 'draft' | 'published';
    let activeVersion: DashboardVersion;
    
    if (publishedVersion) {
      // If published version exists, use it
      currentVersion = 'published';
      activeVersion = publishedVersion;
    } else if (draftVersion) {
      // If no published version but draft exists, use draft
      currentVersion = 'draft';
      activeVersion = draftVersion;
    } else {
      // No versions available (shouldn't happen in normal flow)
      console.error('No active version found in API response');
      throw new Error('No dashboard version data available');
    }
    
    return {
      uid: apiResponse.id,
      title: apiResponse.title, // Use the actual title from API response
      view_only: false, // This could be determined by user permissions
      links: [],
      tabs: activeVersion.tabs,
      currentVersion,
      publishedVersion,
      draftVersion,
    };
  }

  /**
   * Fetch dashboard structure with caching and request deduplication
   */
  async fetchDashboardStructure(dashboardId: string): Promise<DashboardStructure> {
    const cacheKey = `dashboard_structure_${dashboardId}`;
    
    // Check cache first
    const cached = this.getValidCache<DashboardStructure>(cacheKey);
    if (cached) {
      console.log(`Using cached dashboard structure for ${dashboardId}`);
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Dashboard structure request for ${dashboardId} already pending`);
      return this.pendingRequests.get(cacheKey)!;
    }

    try {
      console.log(`📡 DashboardService: Fetching dashboard structure for ID: ${dashboardId}`);

      // Check rate limit
      await this.checkRateLimit(cacheKey);

      const requestPromise = monitorApiCall(
        'dashboard/structure',
        dashboardId,
        () => getDashboardStructure(dashboardId)
      );
      this.pendingRequests.set(cacheKey, requestPromise);

      const response = await requestPromise;
      
      console.log('Dashboard service received response:', response);
      
      // Validate response structure
      if (!response) {
        console.error('Response is null or undefined');
        throw new Error('Invalid dashboard structure response');
      }

      // Transform the new API response to the expected format
      const dashboardStructure = this.transformApiResponse(response as DashboardApiResponse);
      
      // Cache the dashboard structure
      this.setCache(cacheKey, dashboardStructure);
      
      console.log('Dashboard structure fetched successfully');
      return dashboardStructure;
    } catch (error) {
      console.error('Error fetching dashboard structure:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error
      });
      throw new Error(`Failed to fetch dashboard structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch all widget data for a specific tab with request deduplication
   */
  async fetchTabWidgetData(
    dashboardId: string, 
    tabId: string, 
    widgets: Array<{ refId: string; outputType: string; output: string }>
  ): Promise<Record<string, WidgetData>> {
    const cacheKey = `tab_widgets_${dashboardId}_${tabId}`;
    
    // Check cache first
    const cached = this.getValidCache<Record<string, WidgetData>>(cacheKey);
    if (cached) {
      console.log(`Using cached tab widget data for ${tabId}`);
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Tab widget data request for ${tabId} already pending`);
      return this.pendingRequests.get(cacheKey)!;
    }

    try {
      console.log(`Fetching widget data for tab ${tabId} with ${widgets.length} widgets`);
      
      const requestPromise = Promise.allSettled(
        widgets.map(async (widget) => {
          try {
            // For the new structure, we use the output directly instead of fetching
            const data = { output: widget.output, outputType: widget.outputType };
            return { componentId: widget.refId, data, success: true };
          } catch (error) {
            console.error(`Failed to process data for widget ${widget.refId}:`, error);
            return { componentId: widget.refId, data: null, success: false, error };
          }
        })
      );

      this.pendingRequests.set(cacheKey, requestPromise);

      const results = await requestPromise;
      
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
      
      // Cache the tab widget data
      this.setCache(cacheKey, widgetData);
      
      return widgetData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Tab widget data fetch for ${tabId} was cancelled`);
        throw error;
      }
      
      console.error(`Error fetching tab widget data for ${tabId}:`, error);
      throw new Error(`Failed to fetch tab widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Save draft version
   */
  async saveDraftVersion(dashboardId: string, draftData: any): Promise<DashboardVersion> {
    try {
      console.log(`Saving draft version for dashboard: ${dashboardId}`);
      
      const response = await monitorApiCall(
        'dashboard/save-draft',
        dashboardId,
        () => saveDraft(dashboardId, draftData)
      );
      
      // Clear cache for this dashboard since we've updated it
      this.clearDashboardCache(dashboardId);
      
      console.log('Draft saved successfully');
      return response;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish draft version
   */
  async publishDraftVersion(dashboardId: string): Promise<DashboardVersion> {
    try {
      console.log(`Publishing draft version for dashboard: ${dashboardId}`);
      
      const response = await monitorApiCall(
        'dashboard/publish-draft',
        dashboardId,
        () => publishDraft(dashboardId)
      );
      
      // Clear cache for this dashboard since we've updated it
      this.clearDashboardCache(dashboardId);
      
      console.log('Draft published successfully');
      return response;
    } catch (error) {
      console.error('Error publishing draft:', error);
      throw new Error(`Failed to publish draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cached dashboard structure
   */
  getCachedDashboardStructure(dashboardId: string): DashboardStructure | null {
    const cacheKey = `dashboard_structure_${dashboardId}`;
    return this.getValidCache<DashboardStructure>(cacheKey);
  }

  /**
   * Get cached widget data
   */
  getCachedWidgetData(dashboardId: string, componentId: string, tabId: string): WidgetData | null {
    const cacheKey = `${dashboardId}_${componentId}_${tabId}`;
    return this.getValidCache<WidgetData>(cacheKey);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.pendingRequests.clear();
    console.log('Dashboard cache cleared');
  }

  /**
   * Clear cache for specific dashboard
   */
  clearDashboardCache(dashboardId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(dashboardId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
    
    console.log(`Cleared cache for dashboard ${dashboardId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; pendingRequests: number; expiredEntries: number } {
    let expiredCount = 0;
    for (const [key] of this.cache) {
      if (!this.isCacheValid(key)) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      expiredEntries: expiredCount
    };
  }

  /**
   * Debug method to check for unlimited API calls
   */
  debug(): void {
    const cacheStats = this.getCacheStats();
    
    console.group('🔍 Dashboard Service Debug Info');
    console.log('📊 Cache Statistics:', cacheStats);
    console.log('⏱️ Pending Requests:', Array.from(this.pendingRequests.keys()));
    console.log('🕒 Request Timestamps:', Array.from(this.requestTimestamps.entries()));
    
    // Check for potential issues
    if (cacheStats.pendingRequests > 5) {
      console.warn('⚠️ High number of pending requests detected!');
    }
    
    if (this.requestTimestamps.size > 20) {
      console.warn('⚠️ Many request timestamps - possible memory leak!');
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance(); 