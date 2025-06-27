import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { 
  DashboardStructure, 
  WidgetData, 
  DashboardState, 
  Tab,
  Widget 
} from '../types';

const initialState: DashboardState = {
  structure: null,
  currentTabId: null,
  widgetData: {},
  loadedTabs: new Set(),
  loading: {
    structure: false,
    widgetData: false,
  },
  error: null,
  isEditing: false,
};

export const useDashboard = () => {
  const [state, setState] = useState<DashboardState>(initialState);
  const isInitializingRef = useRef(false);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to set loading state
  const setLoading = useCallback((type: 'structure' | 'widgetData', loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [type]: loading
      }
    }));
  }, []);

  // Helper function to set error
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Fetch dashboard structure
  const fetchDashboardStructure = useCallback(async () => {
    try {
      setLoading('structure', true);
      setError(null);

      const structure = await dashboardService.fetchDashboardStructure();
      
      setState(prev => ({
        ...prev,
        structure,
        currentTabId: structure.tabs.length > 0 ? structure.tabs[0].id : null,
        loading: {
          ...prev.loading,
          structure: false
        }
      }));

      return structure;
    } catch (error) {
      console.error('Failed to fetch dashboard structure:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard structure');
      setLoading('structure', false);
      throw error;
    }
  }, [setLoading, setError]);

  const fetchTabWidgetData = useCallback(async (tabId: string, structure?: DashboardStructure) => {
    // Use provided structure or get from current state
    const currentStructure = structure || state.structure;
    
    if (!currentStructure) {
      console.warn('Dashboard structure not loaded, skipping widget data fetch');
      return;
    }

    if (state.loadedTabs.has(tabId)) {
      console.log(`Tab ${tabId} already loaded, skipping`);
      return;
    }

    try {
      setLoading('widgetData', true);
      setError(null);

      const tab = currentStructure.tabs.find(t => t.id === tabId);
      if (!tab) {
        throw new Error(`Tab ${tabId} not found`);
      }

      const widgetData = await dashboardService.fetchTabWidgetData(
        currentStructure.uid,
        tabId,
        tab.widgets
      );

      setState(prev => ({
        ...prev,
        widgetData: {
          ...prev.widgetData,
          ...widgetData
        },
        loadedTabs: new Set([...prev.loadedTabs, tabId]),
        loading: {
          ...prev.loading,
          widgetData: false
        }
      }));

      console.log(`Successfully loaded widget data for tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to fetch widget data for tab ${tabId}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to fetch widget data');
      setLoading('widgetData', false);
    }
  }, [setLoading, setError]);

  // Initialize dashboard
  const initializeDashboard = useCallback(async () => {
    if (isInitializingRef.current) {
      console.log('Dashboard initialization already in progress');
      return;
    }

    isInitializingRef.current = true;

    try {
      // First, fetch dashboard structure
      const structure = await fetchDashboardStructure();
      
      if (structure && structure.tabs.length > 0) {
        // Only fetch widget data for the first tab initially
        const firstTabId = structure.tabs[0].id;
        console.log(`Initializing dashboard with first tab: ${firstTabId}`);
        await fetchTabWidgetData(firstTabId, structure);
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      isInitializingRef.current = false;
    }
  }, [fetchDashboardStructure, fetchTabWidgetData]);

  // Switch tab
  const switchTab = useCallback(async (tabId: string) => {
    if (state.currentTabId === tabId) {
      return; // Already on this tab
    }

    setState(prev => ({ ...prev, currentTabId: tabId }));
  }, []);

  // Effect to fetch widget data when current tab changes
  useEffect(() => {
    if (state.currentTabId && state.structure && !state.loadedTabs.has(state.currentTabId)) {
      console.log(`Fetching widget data for new tab: ${state.currentTabId}`);
      fetchTabWidgetData(state.currentTabId, state.structure);
    }
  }, [state.currentTabId, state.structure, state.loadedTabs, fetchTabWidgetData]);

  // Get current tab - using useMemo to avoid infinite re-renders
  const currentTab = useMemo((): Tab | null => {
    if (!state.structure || !state.currentTabId) {
      return null;
    }
    return state.structure.tabs.find(tab => tab.id === state.currentTabId) || null;
  }, [state.structure, state.currentTabId]);

  // Get widget data by component ID
  const getWidgetData = useCallback((componentId: string): WidgetData | null => {
    return state.widgetData[componentId] || null;
  }, [state.widgetData]);

  // Get all widgets for current tab with their data - using useMemo to avoid infinite re-renders
  const currentTabWidgets = useMemo((): (Widget & { data: WidgetData | null })[] => {
    if (!currentTab) {
      return [];
    }

    return currentTab.widgets.map((widget: Widget) => ({
      ...widget,
      data: state.widgetData[widget.component_id] || null
    })) as (Widget & { data: WidgetData | null })[];
  }, [currentTab, state.widgetData]);

  // Refresh a specific tab's widget data
  const refreshTabData = useCallback(async (tabId: string) => {
    // Access current state directly to avoid dependency issues
    const currentState = state;
    
    if (!currentState.structure) {
      console.warn('Dashboard structure not loaded, cannot refresh tab data');
      return;
    }

    console.log(`Refreshing widget data for tab: ${tabId}`);
    
    // Remove from loaded tabs to force reload
    setState(prev => ({
      ...prev,
      loadedTabs: new Set([...prev.loadedTabs].filter(id => id !== tabId))
    }));
    
    // Fetch fresh data
    await fetchTabWidgetData(tabId, currentState.structure);
  }, [fetchTabWidgetData]);

  // Refresh current tab
  const refreshCurrentTab = useCallback(async () => {
    // Access current state directly to avoid dependency issues
    const currentState = state;
    
    if (currentState.currentTabId) {
      await refreshTabData(currentState.currentTabId);
    }
  }, [refreshTabData]);

  // Clear all data
  const clearDashboard = useCallback(() => {
    dashboardService.clearCache();
    setState(initialState);
  }, []);

  // Set editing mode
  const setIsEditing = useCallback((editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }));
  }, []);

  return {
    // State
    structure: state.structure,
    currentTabId: state.currentTabId,
    widgetData: state.widgetData,
    loadedTabs: state.loadedTabs,
    loading: state.loading,
    error: state.error,
    isEditing: state.isEditing,

    // Computed values
    currentTab: currentTab,
    currentTabWidgets: currentTabWidgets,

    // Actions
    fetchDashboardStructure,
    fetchTabWidgetData,
    switchTab,
    getWidgetData,
    initializeDashboard,
    refreshCurrentTab,
    refreshTabData,
    clearDashboard,
    setIsEditing,
  };
}; 