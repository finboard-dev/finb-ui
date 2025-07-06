interface ApiCallLog {
  timestamp: number;
  endpoint: string;
  dashboardId: string;
  tabId?: string;
  componentId?: string;
  duration: number;
  success: boolean;
  error?: string;
}

class ApiMonitor {
  private static instance: ApiMonitor;
  private callLogs: ApiCallLog[] = [];
  private maxLogs = 100; // Keep only last 100 calls

  public static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor();
    }
    return ApiMonitor.instance;
  }

  logCall(
    endpoint: string,
    dashboardId: string,
    options: {
      tabId?: string;
      componentId?: string;
      duration: number;
      success: boolean;
      error?: string;
    }
  ) {
    const log: ApiCallLog = {
      timestamp: Date.now(),
      endpoint,
      dashboardId,
      tabId: options.tabId,
      componentId: options.componentId,
      duration: options.duration,
      success: options.success,
      error: options.error,
    };

    this.callLogs.push(log);

    // Keep only the last maxLogs entries
    if (this.callLogs.length > this.maxLogs) {
      this.callLogs = this.callLogs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const status = options.success ? '✅' : '❌';
      console.log(`${status} API Call: ${endpoint} (${options.duration}ms) - Dashboard: ${dashboardId}${options.tabId ? `, Tab: ${options.tabId}` : ''}${options.componentId ? `, Component: ${options.componentId}` : ''}`);
    }
  }

  getCallStats(): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    callsByEndpoint: Record<string, number>;
    recentCalls: ApiCallLog[];
  } {
    const totalCalls = this.callLogs.length;
    const successfulCalls = this.callLogs.filter(log => log.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageDuration = totalCalls > 0 
      ? this.callLogs.reduce((sum, log) => sum + log.duration, 0) / totalCalls 
      : 0;

    const callsByEndpoint: Record<string, number> = {};
    this.callLogs.forEach(log => {
      callsByEndpoint[log.endpoint] = (callsByEndpoint[log.endpoint] || 0) + 1;
    });

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageDuration,
      callsByEndpoint,
      recentCalls: this.callLogs.slice(-10), // Last 10 calls
    };
  }

  getDuplicateCalls(): Array<{
    endpoint: string;
    dashboardId: string;
    tabId?: string;
    componentId?: string;
    count: number;
    timeSpan: number;
  }> {
    const duplicates: Record<string, {
      endpoint: string;
      dashboardId: string;
      tabId?: string;
      componentId?: string;
      count: number;
      firstCall: number;
      lastCall: number;
    }> = {};

    this.callLogs.forEach(log => {
      const key = `${log.endpoint}_${log.dashboardId}_${log.tabId || ''}_${log.componentId || ''}`;
      
      if (!duplicates[key]) {
        duplicates[key] = {
          endpoint: log.endpoint,
          dashboardId: log.dashboardId,
          tabId: log.tabId,
          componentId: log.componentId,
          count: 1,
          firstCall: log.timestamp,
          lastCall: log.timestamp,
        };
      } else {
        duplicates[key].count++;
        duplicates[key].lastCall = log.timestamp;
      }
    });

    return Object.values(duplicates)
      .filter(dup => dup.count > 1)
      .map(dup => ({
        endpoint: dup.endpoint,
        dashboardId: dup.dashboardId,
        tabId: dup.tabId,
        componentId: dup.componentId,
        count: dup.count,
        timeSpan: dup.lastCall - dup.firstCall,
      }))
      .sort((a, b) => b.count - a.count);
  }

  clearLogs(): void {
    this.callLogs = [];
    console.log('API call logs cleared');
  }

  // Debug method to log current state
  debug(): void {
    const stats = this.getCallStats();
    const duplicates = this.getDuplicateCalls();

    console.group('🔍 API Monitor Debug Info');
    console.log('📊 Call Statistics:', stats);
    
    if (duplicates.length > 0) {
      console.warn('⚠️ Duplicate Calls Detected:', duplicates);
    } else {
      console.log('✅ No duplicate calls detected');
    }
    
    console.log('📝 Recent Calls:', stats.recentCalls);
    console.groupEnd();
  }
}

export const apiMonitor = ApiMonitor.getInstance();

// Helper function to wrap API calls with monitoring
export const monitorApiCall = async <T>(
  endpoint: string,
  dashboardId: string,
  apiCall: () => Promise<T>,
  options: { tabId?: string; componentId?: string } = {}
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    
    apiMonitor.logCall(endpoint, dashboardId, {
      tabId: options.tabId,
      componentId: options.componentId,
      duration,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    apiMonitor.logCall(endpoint, dashboardId, {
      tabId: options.tabId,
      componentId: options.componentId,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}; 