'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectIsComponentOpen, toggleComponent } from '@/lib/store/slices/uiSlice';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import DashboardSpecificHeader from '../components/ui/Header';
import DashboardControls from '../components/Dashboard/DashBoardControls';
import DashboardView from '../components/Dashboard/DashboardView';
import DashboardDateControls from '../components/ui/DashboardDateControls';
import { DashboardLoading, DashboardError } from '../components/ui/DashboardLoading';

import { toast } from 'sonner';
import type { Block, DashboardItem, DraggingBlock, Tab, Widget } from '../types';
import { Sidebar } from '@/components/ui/common/sidebar';
import { CompanyModal } from '@/components/ui/common/CompanyModal';
import GlobalLoading from '@/components/ui/common/GlobalLoading';
import DashboardNotFound from '../components/ui/DashboardNotFound';
import { useDashboard, useSaveDashboard, usePublishDraft } from '@/hooks/query-hooks/useDashboard';
import { useInactiveCompany } from '@/hooks/useInactiveCompany';
import { useCompanyData } from '@/hooks/query-hooks/useCompany';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useSelector } from 'react-redux';
import { useDashboardDateControls } from '../hooks/useDashboardDateControls';
import { updateTabDates, validateDateRange } from '../services/tabDateService';
import { updateBlockTitle, validateBlockTitle } from '../services/blockService';

/**
 * Parses the widget data from the API into the format expected by the GridElement component.
 * @param output
 * @param outputType
 * @returns
 */
function parseWidgetData(output: string, outputType: 'GRAPH' | 'TABLE' | 'KPI'): any {
  // Handle null or undefined data (widget data is fetched separately)
  if (!output) {
    console.warn('Widget output is null or undefined - may still be loading');
    return null;
  }

  if (outputType === 'GRAPH' && typeof output === 'string') {
    try {
      return JSON.parse(output);
    } catch (e) {
      console.error('Failed to parse graph data:', e);
      return { error: 'Invalid JSON format' };
    }
  }
  // For tables, we will pass the HTML string directly. GridElement will handle it.
  // For KPIs, the data is already in a compatible object format.
  return output;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.dashboardId as string;
  const dispatch = useAppDispatch();

  const selectedCompanyId = useSelector((state: any) => state.user.selectedCompany?.id);

  // Use URL sync to ensure proper organization and company initialization
  const { isAuthenticated, isSyncing } = useUrlSync({
    syncFromUrl: true,
    syncToUrl: false,
    validateAccess: true,
  });

  // Fetch company data - always fetch companies list, and current company if available
  const {
    isLoading: isCompanyDataLoading,
    error: companyDataError,
    hasOrganization,
  } = useCompanyData(selectedCompanyId);

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  const {
    structure,
    currentTabId,
    currentTabWidgets,
    loading,
    error,
    loadedTabs,
    switchTab,
    isEditing,
    setIsEditing,
    currentVersion,
    canEdit,
    canPublish,
    switchToDraft,
    switchToPublished,
    saveDraft,
    publishDraft,
    refetchStructure,
  } = useDashboard(dashboardId);

  // React Query hooks for dashboard operations
  const saveDashboardMutation = useSaveDashboard();
  const publishDraftMutation = usePublishDraft();
  const queryClient = useQueryClient();

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [viewBlocks, setViewBlocks] = useState<Block[]>([]);
  const [apiComponents, setApiComponents] = useState<Block[]>([]);
  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalDashboardState, setOriginalDashboardState] = useState<any>(null);

  // State for frontend date filter - will be initialized after currentTab is defined
  const [currentFilterStartDate, setCurrentFilterStartDate] = useState<string | undefined>();
  const [currentFilterEndDate, setCurrentFilterEndDate] = useState<string | undefined>();

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: 'ui/initializeComponent',
      payload: {
        type: 'sidebar',
        id: 'sidebar-chat',
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

  // Reset metrics loaded state when dashboard changes
  useEffect(() => {
    setMetricsLoaded(false);
    setApiComponents([]);
  }, [dashboardId]);

  // Initialize dashboard on component mount or when dashboardId changes
  useEffect(() => {
    if (!dashboardId) {
      return; // Let the component handle the missing dashboardId case
    }

    console.log('🚀 Starting dashboard initialization for:', dashboardId);
    // React Query will automatically handle the dashboard fetching
    // No need to manually initialize as the hook handles it
  }, [dashboardId]);

  // Transform widgets to blocks and dashboard items when currentTabWidgets change
  useEffect(() => {
    // Clear dashboard items when switching tabs, even if no widgets
    if (!currentTabWidgets) {
      setViewBlocks([]);
      setDashboardItems([]);
      return;
    }

    // If current tab has no widgets, clear the dashboard
    if (currentTabWidgets.length === 0) {
      setViewBlocks([]);
      setDashboardItems([]);
      return;
    }

    const newBlocks: Block[] = [];
    const newDashboardItems: DashboardItem[] = [];

    currentTabWidgets.forEach((widget) => {
      // Create a Block definition from the widget
      const block: Block = {
        id: widget.refId,
        title: widget.title,
        subtitle: '', // Default subtitle since it's not in Widget type
        type: widget.outputType,
        filter: {}, // Filter is not in the new widget structure
        content: parseWidgetData(widget.output, widget.outputType),
        refVersion: widget.refVersion, // Include refVersion from widget
        refType: widget.refType, // Include refType from widget
      };
      newBlocks.push(block);

      // Create a DashboardItem for the grid
      const dashboardItem: DashboardItem = {
        id: uuidv4(), // ✅ Generate unique ID for each dashboard item
        blockId: widget.refId, // ✅ Use widget.refId as blockId to reference the component
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: widget.position.minW,
        minH: widget.position.minH,
      };
      newDashboardItems.push(dashboardItem);
    });

    setViewBlocks(newBlocks);
    setDashboardItems(newDashboardItems);

    // Set original state for change tracking
    const originalState = {
      dashboardItems: newDashboardItems,
      viewBlocks: newBlocks,
      apiComponents: [],
      currentTabWidgets: currentTabWidgets,
    };
    setOriginalDashboardState(originalState);
    setHasUnsavedChanges(false);
  }, [currentTabWidgets]);

  // Track changes in dashboard content
  useEffect(() => {
    if (!originalDashboardState) return;

    const hasChanges =
      JSON.stringify(dashboardItems) !== JSON.stringify(originalDashboardState.dashboardItems) ||
      JSON.stringify(viewBlocks) !== JSON.stringify(originalDashboardState.viewBlocks) ||
      JSON.stringify(apiComponents) !== JSON.stringify(originalDashboardState.apiComponents);

    setHasUnsavedChanges(hasChanges);
  }, [dashboardItems, viewBlocks, apiComponents, originalDashboardState]);

  // Memoized values for better performance
  const currentTab = useMemo(() => {
    if (!structure || !currentTabId) return null;
    // Simple logic: if publishedVersion exists, use it; otherwise use draftVersion
    const activeVersion = structure.publishedVersion || structure.draftVersion;
    return activeVersion?.tabs.find((tab: any) => tab.id === currentTabId) || null;
  }, [structure, currentTabId]);

  // Initialize filter dates when currentTab changes
  useEffect(() => {
    if (currentTab) {
      setCurrentFilterStartDate(currentTab.startDate);
      setCurrentFilterEndDate(currentTab.endDate);
    }
  }, [currentTab]);

  const effectiveIsEditing = useMemo(() => {
    return isEditing && currentVersion === 'draft';
  }, [isEditing, currentVersion]);

  const isViewOnlyMode = useMemo(() => {
    return !canEdit || currentVersion !== 'draft';
  }, [canEdit, currentVersion]);

  // Dashboard date controls hook
  const {
    isRefreshing: isRefreshingFromHook,
    lastRefreshedAt,
    handleDateRangeChange: handleDateRangeChangeFromHook,
    handleRefresh,
  } = useDashboardDateControls({
    currentTabStartDate: currentTab?.startDate,
    currentTabEndDate: currentTab?.endDate,
    currentTabId: currentTabId || undefined,
  });

  // Helper function to get current tabs based on version
  const getCurrentTabs = useMemo(() => {
    if (!structure) return [];
    // View mode: always show published version if it exists
    // Edit mode: always show draft version
    if (effectiveIsEditing) {
      return structure.draftVersion?.tabs || [];
    } else {
      // View mode - show published version if it exists, otherwise draft
      const activeVersion = structure.publishedVersion || structure.draftVersion;
      return activeVersion?.tabs || [];
    }
  }, [structure, effectiveIsEditing]);

  // Load metrics when not in edit mode (DashboardControls not rendered)
  useEffect(() => {
    if (!effectiveIsEditing && !metricsLoaded && !metricsLoading) {
      // If not in edit mode, we still need to load metrics for potential future use
      // This ensures metrics are available when switching to edit mode
      setMetricsLoaded(true); // Mark as loaded to avoid infinite loading
    }
  }, [effectiveIsEditing, metricsLoaded, metricsLoading]);

  // Show loading while URL sync or company data is being fetched
  if (isSyncing || isCompanyDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <GlobalLoading message={isSyncing ? 'Initializing...' : 'Loading company data...'} />
      </div>
    );
  }

  // If no organization is selected, show message
  if (!hasOrganization) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    );
  }

  // If no dashboard ID is provided, show not found component
  if (!dashboardId) {
    return <DashboardNotFound />;
  }

  // If dashboard is not found (error contains 404, not found, or "No value present"), show not found component
  if (
    error &&
    error instanceof Error &&
    (error.message.includes('404') ||
      error.message.includes('not found') ||
      error.message.includes('No value present') ||
      error.message.includes('Failed to fetch dashboard structure'))
  ) {
    return <DashboardNotFound dashboardId={dashboardId} />;
  }

  const handleSaveDashboard = async () => {
    if (!structure || currentVersion !== 'draft') {
      toast.error('Cannot save: not in draft mode or no structure available');
      return;
    }

    try {
      // Get the draft version tabs
      const draftVersion = structure.draftVersion;
      if (!draftVersion) {
        toast.error('No draft version available for saving');
        return;
      }

      // Map all tabs with their widgets
      const tabs = draftVersion.tabs.map((tab: any) => {
        if (tab.id === currentTabId) {
          // For the current tab, use ALL dashboardItems (current state after drag/drop/resize)
          // This handles: new components from sidebar, deleted components, moved components
          const updatedWidgets = dashboardItems
            .map((item) => {
              // Search in both viewBlocks and apiComponents to find the block
              const block =
                viewBlocks.find((b) => b.id === item.blockId) || apiComponents.find((b) => b.id === item.blockId);

              if (!block) {
                console.warn(`Block ${item.blockId} not found in viewBlocks or apiComponents`);
                console.log('Available blocks:', {
                  viewBlocks: viewBlocks.map((b) => ({
                    id: b.id,
                    title: b.title,
                    type: b.type,
                  })),
                  apiComponents: apiComponents.map((b) => ({
                    id: b.id,
                    title: b.title,
                    type: b.type,
                    refVersion: b.refVersion,
                    refType: b.refType,
                  })),
                  dashboardItems: dashboardItems.map((item) => ({
                    id: item.id,
                    blockId: item.blockId,
                  })),
                });
                return null;
              }

              console.log(`Creating widget for block:`, {
                blockId: item.blockId,
                blockTitle: block.title,
                blockType: block.type,
                blockRefVersion: block.refVersion,
                blockRefType: block.refType,
                hasContent: !!block.content,
              });

              return {
                id: item.id,
                title: block.title,
                position: {
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                  min_w: item.minW,
                  min_h: item.minH,
                },
                refId: item.blockId,
                refVersion: block.refVersion || 'latest', // Use block's refVersion if available
                refType: block.refType || 'METRIC', // Use block's refType if available
                outputType: block.type as string,
                output: block.content || '', // Include the output data
              };
            })
            .filter((widget): widget is NonNullable<typeof widget> => widget !== null);

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: updatedWidgets,
          };
        }
        return {
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
        };
      });

      // Prepare the save request
      const saveRequest = {
        id: structure.draftVersion?.id || structure.id, // Use draftVersion.id or structure.id
        dashboardId: dashboardId, // Add the dashboard ID
        tabs: tabs,
      };

      console.log('Saving dashboard with data:', saveRequest);
      console.log('Save details:', {
        dashboardItemsCount: dashboardItems.length,
        viewBlocksCount: viewBlocks.length,
        apiComponentsCount: apiComponents.length,
        currentTabId,
        currentTabWidgetsCount: currentTabWidgets?.length || 0,
      });

      // Call the save API using React Query
      await saveDashboardMutation.mutateAsync(saveRequest);

      // Reset change tracking after successful save
      const newOriginalState = {
        dashboardItems,
        viewBlocks,
        apiComponents,
        currentTabWidgets,
      };
      setOriginalDashboardState(newOriginalState);
      setHasUnsavedChanges(false);

      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save draft');
    }
  };

  const handlePublishDraft = async () => {
    try {
      await publishDraftMutation.mutateAsync(dashboardId);
      toast.success('Dashboard published successfully');
    } catch (error) {
      toast.error('Failed to publish dashboard');
    }
  };

  const handleSwitchToDraft = () => {
    switchToDraft();
    toast.info('Switched to draft version');
  };

  const handleSwitchToPublished = () => {
    switchToPublished();
    toast.info('Switched to published version');
  };

  const handleSetIsEditing = (editing: boolean) => {
    // Remove view_only check since it doesn't exist in new API response
    // Only allow editing in draft mode
    if (currentVersion !== 'draft') {
      toast.error('You can only edit in draft mode.');
      return;
    }
    setIsEditing(editing);
  };

  const handleTabChange = async (tabId: string) => {
    try {
      await switchTab(tabId);
    } catch (error) {
      toast.error(`Failed to switch to tab: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTabReorder = (newTabs: { id: string; label: string }[]) => {
    // This would need to be implemented to update the backend
    console.log('Tab reorder:', newTabs);
  };

  const handleDeleteTab = async (tabId: string) => {
    if (!structure || currentVersion !== 'draft') {
      toast.error('Can only delete tabs in draft mode');
      return;
    }

    try {
      // Get current tabs and remove the specified tab
      const currentTabs = getCurrentTabs;
      const updatedTabs = currentTabs.filter((tab: any) => tab.id !== tabId);

      // If we're deleting the active tab, switch to the first available tab
      if (currentTabId === tabId && updatedTabs.length > 0) {
        await switchTab(updatedTabs[0].id);
      } else if (currentTabId === tabId && updatedTabs.length === 0) {
        // If no tabs left, we might want to handle this case
        toast.warning('No tabs remaining');
      }

      // Save the updated structure to the backend
      const saveRequest = {
        id: structure.draftVersion?.id || structure.id,
        dashboardId: dashboardId,
        tabs: updatedTabs.map((tab: any) => ({
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

      await saveDashboardMutation.mutateAsync(saveRequest);
      toast.success('Tab deleted successfully');
    } catch (error) {
      console.error('Error deleting tab:', error);
      toast.error('Failed to delete tab');
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const handleApplyTabReorder = async (newTabs: { id: string; label: string }[]) => {
    if (!structure || currentVersion !== 'draft') {
      toast.error('Can only reorder tabs in draft mode');
      return;
    }

    try {
      // Get current tabs and update their positions based on the new order
      const currentTabs = getCurrentTabs;
      const updatedTabs = newTabs.map((newTab, index) => {
        const existingTab = currentTabs.find((tab: any) => tab.id === newTab.id);
        if (!existingTab) {
          throw new Error(`Tab ${newTab.id} not found`);
        }
        return {
          ...existingTab,
          position: index, // Update position based on new order
        };
      });

      // Save the updated structure to the backend
      const saveRequest = {
        id: structure.draftVersion?.id || structure.id,
        dashboardId: dashboardId,
        tabs: updatedTabs.map((tab: any) => ({
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

      await saveDashboardMutation.mutateAsync(saveRequest);

      // Reset change tracking after successful tab reorder
      const newOriginalState = {
        dashboardItems,
        viewBlocks,
        apiComponents,
        currentTabWidgets,
      };
      setOriginalDashboardState(newOriginalState);
      setHasUnsavedChanges(false);

      toast.success('Tab order updated successfully');
    } catch (error) {
      console.error('Error applying tab reorder:', error);
      toast.error('Failed to apply tab reorder');
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const handleRenameTab = async (tabId: string, newTitle: string) => {
    if (!structure || currentVersion !== 'draft') {
      toast.error('Can only rename tabs in draft mode');
      return;
    }

    if (!newTitle.trim()) {
      toast.error('Tab title cannot be empty');
      return;
    }

    try {
      // Get current tabs and update the specified tab's title
      const currentTabs = getCurrentTabs;
      const updatedTabs = currentTabs.map((tab: any) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            title: newTitle.trim(),
          };
        }
        return tab;
      });

      // Save the updated structure to the backend
      const saveRequest = {
        id: structure.draftVersion?.id || structure.id,
        dashboardId: dashboardId,
        tabs: updatedTabs.map((tab: any) => ({
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

      await saveDashboardMutation.mutateAsync(saveRequest);
      toast.success('Tab renamed successfully');
    } catch (error) {
      console.error('Error renaming tab:', error);
      toast.error('Failed to rename tab');
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    if (!currentTabId || !structure) return;

    try {
      // Validate the date range
      if (!validateDateRange(startDate, endDate)) {
        return;
      }

      // Update the tab dates
      await updateTabDates({
        dashboardId,
        tabId: currentTabId,
        startDate,
        endDate,
        currentTabs: getCurrentTabs,
      });

      // Call the hook's date range change handler
      await handleDateRangeChangeFromHook(startDate, endDate);

      // Refetch the dashboard structure to get updated data
      await refetchStructure();

      toast.success('Date range updated successfully');
    } catch (error) {
      console.error('Error updating date range:', error);
      toast.error('Failed to update date range');
    }
  };

  // New handler for frontend filter functionality
  const handleExecuteWithNewDates = async (startDate: string, endDate: string) => {
    if (!currentTabId || !structure) return;

    try {
      // Validate the date range
      if (!validateDateRange(startDate, endDate)) {
        return;
      }

      console.log('🔄 Triggering frontend filter with new dates:', { startDate, endDate });

      // Update the state for frontend filter
      setCurrentFilterStartDate(startDate);
      setCurrentFilterEndDate(endDate);

      // Invalidate all component execution queries to force refetch with new dates
      // This will trigger all widgets to re-execute with the new date range
      await queryClient.invalidateQueries({ queryKey: ['component-execution'] });

      toast.success('Date filter applied successfully');
    } catch (error) {
      console.error('Error applying date filter:', error);
      toast.error('Failed to apply date filter');
    }
  };

  const handleBlockTitleUpdate = async (blockId: string, newTitle: string) => {
    if (!currentTabId || !structure) return;

    try {
      // Validate the block title
      if (!validateBlockTitle(newTitle)) {
        return;
      }

      // Update the block title
      await updateBlockTitle({
        dashboardId,
        tabId: currentTabId,
        blockId,
        newTitle,
        currentTabs: getCurrentTabs,
      });

      // Refetch the dashboard structure to get updated data
      await refetchStructure();

      toast.success('Block title updated successfully');
    } catch (error) {
      console.error('Error updating block title:', error);
      toast.error('Failed to update block title');
    }
  };

  const handleAddNewTab = async (tabData: { title: string; startDate: string; endDate: string; position: number }) => {
    if (!structure || currentVersion !== 'draft') {
      toast.error('Can only add tabs in draft mode');
      return;
    }

    try {
      // Create new tab with the provided data
      const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: tabData.title,
        startDate: tabData.startDate,
        endDate: tabData.endDate,
        position: tabData.position,
        lastRefreshedAt: null,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new tab to the current structure
      const currentTabs = getCurrentTabs;
      const updatedTabs = [...currentTabs, newTab];

      // Save the updated structure to the backend
      const saveRequest = {
        id: structure.draftVersion?.id || structure.id,
        dashboardId: dashboardId,
        tabs: updatedTabs.map((tab: any) => ({
          id: tab.id,
          title: tab.title,
          position: tab.position,
          startDate: tab.startDate,
          endDate: tab.endDate,
          widgets:
            tab.id === newTab.id
              ? []
              : tab.widgets.map((widget: any) => ({
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

      await saveDashboardMutation.mutateAsync(saveRequest);

      // Switch to the new tab
      await switchTab(newTab.id);

      toast.success('New tab added successfully');

      // Reload page after successful addition
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to ensure the API call completes
    } catch (error) {
      console.error('Error adding new tab:', error);
      toast.error('Failed to add new tab');
    }
  };

  const handleLoadDashboard = (newDashboardId: string) => {
    router.push(`/dashboard/${newDashboardId}`);
  };

  const handleNewDashboard = () => {
    // For now, redirect to a default dashboard
    // In a real app, you might want to create a new dashboard ID
    router.push('/dashboard/XERO_DASH_001');
  };

  // Show loading state for dashboard structure and metrics
  console.log('Loading states:', {
    structureLoading: loading.structure,
    metricsLoading,
    metricsLoaded,
    hasStructure: !!structure,
    hasError: !!error,
    shouldShowLoading: loading.structure || (metricsLoading && !metricsLoaded) || (!structure && !error),
  });

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Dashboard" />;
  }

  if (loading.structure || (metricsLoading && !metricsLoaded) || (!structure && !error)) {
    return <GlobalLoading message="Loading Dashboard..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <DashboardSpecificHeader
            isEditing={effectiveIsEditing}
            setIsEditing={handleSetIsEditing}
            onSaveDashboard={handleSaveDashboard}
            currentDashboardName={structure?.title}
            isViewOnly={isViewOnlyMode}
            tabs={
              getCurrentTabs.map((tab: any) => ({
                id: tab.id,
                label: tab.title,
              })) || []
            }
            activeTab={currentTabId}
            onTabChange={handleTabChange}
            onTabReorder={handleTabReorder}
            loadedTabs={loadedTabs}
            currentTabLoading={false}
            currentVersion={currentVersion}
            canEdit={canEdit}
            canPublish={canPublish}
            onSaveDraft={handleSaveDashboard}
            onPublishDraft={handlePublishDraft}
            onSwitchToDraft={handleSwitchToDraft}
            onSwitchToPublished={handleSwitchToPublished}
            onAddNewTab={handleAddNewTab}
            onDeleteTab={handleDeleteTab}
            onApplyTabReorder={handleApplyTabReorder}
            onRenameTab={handleRenameTab}
            publishedVersion={structure?.publishedVersion}
            draftVersion={structure?.draftVersion}
            // Loading state for apply reorder
            isApplyingReorder={saveDashboardMutation.isPending}
            // Change tracking props
            hasUnsavedChanges={hasUnsavedChanges}
            dashboardItems={dashboardItems}
            viewBlocks={viewBlocks}
            apiComponents={apiComponents}
            currentTabWidgets={currentTabWidgets}
          />
          <DashboardError error={error instanceof Error ? error.message : String(error)} />
        </div>
        <CompanyModal />
      </div>
    );
  }

  // Widget data loading is no longer needed since we removed the API

  return (
    <div className="flex h-screen select-none">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <DashboardSpecificHeader
          isEditing={effectiveIsEditing}
          setIsEditing={handleSetIsEditing}
          onSaveDashboard={handleSaveDashboard}
          currentDashboardName={structure?.title}
          isViewOnly={isViewOnlyMode}
          tabs={
            getCurrentTabs.map((tab: any) => ({
              id: tab.id,
              label: tab.title,
            })) || []
          }
          activeTab={currentTabId}
          onTabChange={handleTabChange}
          onTabReorder={handleTabReorder}
          loadedTabs={loadedTabs}
          currentTabLoading={false}
          currentVersion={currentVersion}
          canEdit={canEdit}
          canPublish={canPublish}
          onSaveDraft={handleSaveDashboard}
          onPublishDraft={handlePublishDraft}
          onSwitchToDraft={handleSwitchToDraft}
          onSwitchToPublished={handleSwitchToPublished}
          onAddNewTab={handleAddNewTab}
          onDeleteTab={handleDeleteTab}
          onApplyTabReorder={handleApplyTabReorder}
          onRenameTab={handleRenameTab}
          publishedVersion={structure?.publishedVersion}
          draftVersion={structure?.draftVersion}
          // Loading state for apply reorder
          isApplyingReorder={saveDashboardMutation.isPending}
          // Change tracking props
          hasUnsavedChanges={hasUnsavedChanges}
          dashboardItems={dashboardItems}
          viewBlocks={viewBlocks}
          apiComponents={apiComponents}
          currentTabWidgets={currentTabWidgets}
        />

        {/* Dashboard Date Controls */}
        <DashboardDateControls
          currentTabStartDate={currentFilterStartDate || currentTab?.startDate}
          currentTabEndDate={currentFilterEndDate || currentTab?.endDate}
          onDateRangeChange={handleDateRangeChange}
          onExecuteWithNewDates={handleExecuteWithNewDates}
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
          lastRefreshedAt={lastRefreshedAt}
          isEditing={effectiveIsEditing}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Dashboard Controls */}
          {effectiveIsEditing && (
            <div className="">
              <DashboardControls
                blocks={[]} // Empty array since we're using API-loaded components
                setBlocks={() => {}} // Required prop but not used in this implementation
                onDragStart={(block) => {
                  setDraggingBlock({
                    id: block.id,
                    type: block.type,
                    width: block.type === 'TABLE' ? 48 : 24,
                    height: block.type === 'TABLE' ? 26 : 12,
                    htmlTable: block.htmlTable,
                  });
                }}
                onApiComponentsLoaded={setApiComponents}
                onMetricsLoadingChange={setMetricsLoading}
                onMetricsLoaded={() => setMetricsLoaded(true)}
                onMetricsError={() => setMetricsLoaded(true)} // Mark as loaded even on error to avoid infinite loading
                currentTabStartDate={currentTab?.startDate}
                currentTabEndDate={currentTab?.endDate}
              />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 bg-gray-50 overflow-auto">
            <DashboardView
              className="flex-grow h-full"
              dashboardItems={dashboardItems}
              setDashboardItems={setDashboardItems}
              blocks={[...viewBlocks, ...apiComponents]} // Include both view blocks and API components
              draggingBlock={draggingBlock}
              isEditing={effectiveIsEditing}
              currentTabStartDate={currentFilterStartDate || currentTab?.startDate}
              currentTabEndDate={currentFilterEndDate || currentTab?.endDate}
              onBlockTitleUpdate={handleBlockTitleUpdate}
            />
          </div>
        </div>
      </div>
      <CompanyModal />
    </div>
  );
}
