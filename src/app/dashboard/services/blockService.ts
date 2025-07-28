import { saveDashboard } from '@/lib/api/dashboard';
import { toast } from 'sonner';

export interface UpdateBlockTitleRequest {
  dashboardId: string;
  tabId: string;
  blockId: string;
  newTitle: string;
  currentTabs: any[];
}

export const updateBlockTitle = async (request: UpdateBlockTitleRequest) => {
  try {
    const { dashboardId, tabId, blockId, newTitle, currentTabs } = request;

    // Find the tab and update the specific block's title
    const updatedTabs = currentTabs.map((tab) => {
      if (tab.id === tabId) {
        return {
          ...tab,
          widgets: tab.widgets.map((widget: any) => {
            if (widget.refId === blockId) {
              return {
                ...widget,
                title: newTitle,
              };
            }
            return widget;
          }),
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
        widgets: tab.widgets.map((widget: any) => ({
          id: widget.id,
          title: widget.title,
          position: {
            x: widget.position.x,
            y: widget.position.y,
            w: widget.position.w,
            h: widget.position.h,
            min_w: widget.position.minW,
            min_h: widget.position.minH,
          },
          refId: widget.refId,
          refVersion: widget.refVersion,
          refType: widget.refType,
          outputType: widget.outputType,
        })),
      })),
    };

    // Call the save API
    await saveDashboard(saveRequest);

    return { success: true, updatedTabs };
  } catch (error) {
    console.error('Error updating block title:', error);
    throw new Error('Failed to update block title');
  }
};

export const validateBlockTitle = (title: string): boolean => {
  if (!title.trim()) {
    toast.error('Block title cannot be empty');
    return false;
  }
  
  if (title.trim().length > 100) {
    toast.error('Block title must be less than 100 characters');
    return false;
  }
  
  return true;
}; 