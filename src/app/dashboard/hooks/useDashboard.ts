import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { 
  DashboardStructure, 
  WidgetData, 
  DashboardState, 
  Tab,
  Widget 
} from '../types';
import { toast } from 'sonner';

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
  // New versioning state
  currentVersion: 'published',
  canEdit: false,
  canPublish: false,
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
        tab.widgets.map(widget => ({
          refId: widget.refId,
          outputType: widget.outputType,
          output: widget.output
        }))
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
      
      // Set initial version and permissions based on API response
      const hasPublishedVersion = !!structure?.publishedVersion;
      const hasDraftVersion = !!structure?.draftVersion;
      
      // Determine which version to show initially
      let initialVersion: 'draft' | 'published';
      let initialIsEditing: boolean;
      let initialCanEdit: boolean;
      let initialCanPublish: boolean;
      
      if (hasPublishedVersion) {
        // If published version exists, show it in view mode
        initialVersion = 'published';
        initialIsEditing = false; // Published version is always in view mode
        initialCanEdit = hasDraftVersion; // Can edit if draft exists
        initialCanPublish = false; // Can't publish when viewing published
      } else if (hasDraftVersion) {
        // If only draft exists, show it in edit mode
        initialVersion = 'draft';
        initialIsEditing = true; // Draft version is always in edit mode
        initialCanEdit = true; // Can edit draft
        initialCanPublish = true; // Can publish draft
      } else {
        // No versions exist (shouldn't happen in normal flow)
        initialVersion = 'draft';
        initialIsEditing = true;
        initialCanEdit = false;
        initialCanPublish = false;
      }
      
      setState(prev => ({
        ...prev,
        currentVersion: initialVersion,
        canEdit: initialCanEdit,
        canPublish: initialCanPublish,
        isEditing: initialIsEditing
      }));
      
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

  // Switch to draft version
  const switchToDraft = useCallback(() => {
    if (!state.structure?.draftVersion) {
      console.warn('No draft version available');
      toast.error('No draft version available');
      return;
    }

    setState(prev => ({
      ...prev,
      structure: prev.structure ? {
        ...prev.structure,
        tabs: prev.structure.draftVersion!.tabs,
        currentVersion: 'draft'
      } : null,
      currentVersion: 'draft',
      isEditing: true, // Draft is always in edit mode
      canEdit: true,
      canPublish: !!prev.structure?.publishedVersion, // Can publish if published version exists
      // Reset loaded tabs when switching versions
      loadedTabs: new Set(),
      widgetData: {}
    }));
  }, [state.structure]);

  // Switch to published version
  const switchToPublished = useCallback(() => {
    if (!state.structure?.publishedVersion) {
      console.warn('No published version available');
      toast.error('No published version available');
      return;
    }

    setState(prev => ({
      ...prev,
      structure: prev.structure ? {
        ...prev.structure,
        tabs: prev.structure.publishedVersion!.tabs,
        currentVersion: 'published'
      } : null,
      currentVersion: 'published',
      isEditing: false, // Published is always in view mode
      canEdit: !!prev.structure?.draftVersion, // Can edit if draft exists
      canPublish: false, // Can't publish when viewing published
      // Reset loaded tabs when switching versions
      loadedTabs: new Set(),
      widgetData: {}
    }));
  }, [state.structure]);

  // Save draft version
  const saveDraft = useCallback(async () => {
    if (!state.structure || state.currentVersion !== 'draft') {
      console.warn('Cannot save: not in draft mode or no structure');
      return;
    }

    try {
      console.log('Saving draft version...');
      await dashboardService.saveDraftVersion(state.structure.uid, state.structure);
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }, [state.structure, state.currentVersion]);

  // Publish draft version
  const publishDraft = useCallback(async () => {
    if (!state.structure || state.currentVersion !== 'draft') {
      console.warn('Cannot publish: not in draft mode or no structure');
      return;
    }

    try {
      console.log('Publishing draft version...');
      await dashboardService.publishDraftVersion(state.structure.uid);
      console.log('Draft published successfully');
      
      // Switch to published version after successful publish
      switchToPublished();
    } catch (error) {
      console.error('Failed to publish draft:', error);
      throw error;
    }
  }, [state.structure, state.currentVersion, switchToPublished]);

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
      data: state.widgetData[widget.refId] || null
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
      currentVersion: state.currentVersion,
      canEdit: state.canEdit,
      canPublish: state.canPublish,
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
    currentVersion: state.currentVersion,
    canEdit: state.canEdit,
    canPublish: state.canPublish,

    // Actions
    initializeDashboard,
    switchTab,
    refreshTabData,
    setIsEditing,
    getWidgetData,
    switchToDraft,
    switchToPublished,
    saveDraft,
    publishDraft,
    debug, // Expose debug method
  };
}; 