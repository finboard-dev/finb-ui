import { saveDashboard } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { validateDateRange as validateDateRangeUtil } from '../utils/dateUtils';

export interface UpdateTabDateRequest {
  dashboardId: string;
  tabId: string;
  startDate: string;
  endDate: string;
  currentTabs: any[];
}

export const updateTabDates = async (request: UpdateTabDateRequest) => {
  try {
    const { dashboardId, tabId, startDate, endDate, currentTabs } = request;

    // Find the tab to update
    const updatedTabs = currentTabs.map((tab) => {
      if (tab.id === tabId) {
        return {
          ...tab,
          startDate,
          endDate,
        };
      }
      return tab;
    });

    // Prepare the save request
    const saveRequest = {
      id: dashboardId,
      dashboardId,
      tabs: updatedTabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        position: tab.position,
        startDate: tab.startDate,
        endDate: tab.endDate,
        widgets: tab.widgets || [],
      })),
    };

    // Call the save API
    await saveDashboard(saveRequest);

    return { success: true, updatedTabs };
  } catch (error) {
    console.error('Error updating tab dates:', error);
    throw new Error('Failed to update tab dates');
  }
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  if (!validateDateRangeUtil(startDate, endDate)) {
    toast.error('Invalid date range. End date must be after start date.');
    return false;
  }
  
  return true;
}; 