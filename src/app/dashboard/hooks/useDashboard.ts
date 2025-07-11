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

export const useDashboard = (dashboardId?: string) => {
  console.log('🎯 useDashboard hook called with dashboardId:', dashboardId);
  
  const [state, setState] = useState<DashboardState>(initialState);
  const isInitializingRef = useRef(false);
  const currentDashboardIdRef = useRef<string | undefined>(dashboardId);
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when dashboardId changes
  useEffect(() => {
    currentDashboardIdRef.current = dashboardId;
  }, [dashboardId]);

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

  // Reset state when dashboardId changes
  const resetState = useCallback(() => {
    setState(initialState);
    isInitializingRef.current = false;
    pendingRequestsRef.current.clear();
  }, []);

  // Fetch dashboard structure with request deduplication
  const fetchDashboardStructure = useCallback(async () => {
    const currentDashboardId = currentDashboardIdRef.current;
    
    console.log('📡 fetchDashboardStructure called with:', currentDashboardId);
    
    if (!currentDashboardId) {
      throw new Error('Dashboard ID is required');
    }

    const requestKey = `structure_${currentDashboardId}`;
    
    // Check if request is already pending
    if (pendingRequestsRef.current.has(requestKey)) {
      console.log('Dashboard structure request already pending, skipping');
      return;
    }

    // Check if we already have the structure cached
    const cachedStructure = dashboardService.getCachedDashboardStructure(currentDashboardId);
    if (cachedStructure) {
      console.log('Using cached dashboard structure');
      setState(prev => ({
        ...prev,
        structure: cachedStructure,
        currentTabId: cachedStructure.tabs.length > 0 ? cachedStructure.tabs[0].id : null,
      }));
      return cachedStructure;
    }

    try {
      pendingRequestsRef.current.add(requestKey);
      setLoading('structure', true);
      setError(null);

      const structure = await dashboardService.fetchDashboardStructure(currentDashboardId);
      
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
    } finally {
      pendingRequestsRef.current.delete(requestKey);
    }
  }, [setLoading, setError]);

  // Fetch tab widget data with request deduplication
  const fetchTabWidgetData = useCallback(async (tabId: string, structure?: DashboardStructure) => {
    const currentDashboardId = currentDashboardIdRef.current;
    
    if (!currentDashboardId) {
      throw new Error('Dashboard ID is required');
    }

    const requestKey = `widget_${currentDashboardId}_${tabId}`;
    
    // Check if request is already pending
    if (pendingRequestsRef.current.has(requestKey)) {
      console.log(`Widget data request for tab ${tabId} already pending, skipping`);
      return;
    }

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
      pendingRequestsRef.current.add(requestKey);
      setLoading('widgetData', true);
      setError(null);

      const tab = currentStructure.tabs.find(t => t.id === tabId);
      if (!tab) {
        throw new Error(`Tab ${tabId} not found`);
      }

      const widgetData = await dashboardService.fetchTabWidgetData(
        currentDashboardId,
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
    } finally {
      pendingRequestsRef.current.delete(requestKey);
    }
  }, [setLoading, setError]);

  // Initialize dashboard with proper memoization
  const initializeDashboard = useCallback(async () => {
    const currentDashboardId = currentDashboardIdRef.current;
    
    console.log('🔧 initializeDashboard called with:', currentDashboardId);
    
    if (!currentDashboardId) {
      throw new Error('Dashboard ID is required');
    }

    if (isInitializingRef.current) {
      console.log('Dashboard initialization already in progress');
      return;
    }

    console.log('✅ Starting dashboard initialization process');
    isInitializingRef.current = true;

    try {
      // Reset state for new dashboard
      resetState();
      
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
      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, [fetchDashboardStructure, fetchTabWidgetData, resetState]);

  // Switch tab with stable callback
  const switchTab = useCallback((tabId: string) => {
    setState(prev => {
      if (prev.currentTabId === tabId) {
        return prev; // No change needed
      }
      return { ...prev, currentTabId: tabId };
    });
  }, []);

  // Effect to fetch widget data when current tab changes - with debouncing
  useEffect(() => {
    const currentTabId = state.currentTabId;
    const structure = state.structure;
    const loadedTabs = state.loadedTabs;
    
    if (currentTabId && structure && !loadedTabs.has(currentTabId)) {
      // Clear any existing timeout
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
      }
      
      // Debounce tab switching to prevent rapid API calls
      tabSwitchTimeoutRef.current = setTimeout(() => {
        console.log(`Fetching widget data for new tab: ${currentTabId}`);
        fetchTabWidgetData(currentTabId, structure);
      }, 300); // 300ms debounce
    }
  }, [state.currentTabId, state.structure, state.loadedTabs, fetchTabWidgetData]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear pending requests when component unmounts
      pendingRequestsRef.current.clear();
      isInitializingRef.current = false;
      
      // Clear any pending timeouts
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
      }
    };
  }, []);

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

  // Refresh a specific tab's widget data with request deduplication
  const refreshTabData = useCallback(async (tabId: string) => {
    const currentDashboardId = currentDashboardIdRef.current;
    
    if (!currentDashboardId) {
      throw new Error('Dashboard ID is required');
    }

    const requestKey = `refresh_${currentDashboardId}_${tabId}`;
    
    // Check if refresh request is already pending
    if (pendingRequestsRef.current.has(requestKey)) {
      console.log(`Refresh request for tab ${tabId} already pending, skipping`);
      return;
    }

    // Access current state directly to avoid dependency issues
    const currentState = state;
    
    if (!currentState.structure) {
      console.warn('Dashboard structure not loaded, cannot refresh tab data');
      return;
    }

    const tab = currentState.structure.tabs.find(t => t.id === tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }

    try {
      pendingRequestsRef.current.add(requestKey);
      setLoading('widgetData', true);
      setError(null);

      const widgetData = await dashboardService.fetchTabWidgetData(
        currentDashboardId,
        tabId,
        tab.widgets
      );

      setState(prev => ({
        ...prev,
        widgetData: {
          ...prev.widgetData,
          ...widgetData
        },
        loading: {
          ...prev.loading,
          widgetData: false
        }
      }));

      console.log(`Successfully refreshed widget data for tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to refresh widget data for tab ${tabId}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to refresh widget data');
      setLoading('widgetData', false);
    } finally {
      pendingRequestsRef.current.delete(requestKey);
    }
  }, [setLoading, setError]);

  // Toggle editing mode
  const setIsEditing = useCallback((editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }));
  }, []);

  // Debug method to check for unlimited API calls
  const debug = useCallback(() => {
    console.group('🔍 Dashboard Hook Debug Info');
    console.log('📊 Current State:', {
      structure: !!state.structure,
      currentTabId: state.currentTabId,
      loadedTabs: Array.from(state.loadedTabs),
      loading: state.loading,
      error: state.error,
      isEditing: state.isEditing,
    });
    console.log('⏱️ Pending Requests:', Array.from(pendingRequestsRef.current));
    console.log('🔄 Is Initializing:', isInitializingRef.current);
    console.log('🕒 Tab Switch Timeout:', !!tabSwitchTimeoutRef.current);
    
    // Check for potential issues
    if (pendingRequestsRef.current.size > 5) {
      console.warn('⚠️ High number of pending requests detected!');
    }
    
    if (state.loadedTabs.size > 10) {
      console.warn('⚠️ Many loaded tabs - possible memory leak!');
    }
    
    console.groupEnd();
  }, [state]);

  return {
    // State
    structure: state.structure,
    currentTabId: state.currentTabId,
    currentTabWidgets,
    loading: state.loading,
    error: state.error,
    loadedTabs: state.loadedTabs,
    isEditing: state.isEditing,

    // Actions
    initializeDashboard,
    switchTab,
    refreshTabData,
    setIsEditing,
    getWidgetData,
    debug, // Expose debug method
  };
}; 