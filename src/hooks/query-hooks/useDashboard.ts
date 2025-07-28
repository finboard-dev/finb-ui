import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { 
  createDashboard, 
  getDashboardStructure, 
  getDashboards, 
  saveDashboard, 
  saveDraft, 
  publishDraft,
  executeComponent
} from '@/lib/api/dashboard'
import type { 
  CreateDashboardRequest, 
  SaveDashboardRequest, 
  ComponentExecuteRequest,
  ComponentExecuteResponse
} from '@/lib/api/dashboard'
import { DashboardApiResponse, DashboardVersion } from '@/app/dashboard/types'
import { useState, useCallback, useMemo, useEffect } from 'react'

/**
 * React Query-based Dashboard Hooks
 * 
 * These hooks replace the custom useDashboard hook and provide:
 * - Automatic caching and background updates
 * - Optimistic updates
 * - Error handling and retries
 * - Request deduplication
 * - Loading states
 * 
 * Usage:
 * ```tsx
 * const {
 *   structure,
 *   currentTabId,
 *   currentTabWidgets,
 *   loading,
 *   error,
 *   switchTab,
 *   isEditing,
 *   setIsEditing,
 *   switchToDraft,
 *   switchToPublished,
 *   saveDraft,
 *   publishDraft,
 *   refreshTabData,
 * } = useDashboard(dashboardId);
 * ```
 */

export function useCreateDashboard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dashboardData: CreateDashboardRequest) => createDashboard(dashboardData),
    onSuccess: (data) => {
      console.log('Dashboard created successfully:', data)
      
      // Validate that we have the expected data structure
      if (!data || !data.id) {
        console.error('Invalid response data structure:', data)
        return
      }
      
      // Invalidate and refetch dashboard-related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      
      // Optionally, you can also update the cache directly
      queryClient.setQueryData(['dashboard', data.id], data)
    },
    onError: (error) => {
      console.error('Failed to create dashboard:', error)
    }
  })
}

export function useDashboardStructure(dashboardId: string) {
  return useQuery({
    queryKey: ['dashboard', 'structure', dashboardId],
    queryFn: () => getDashboardStructure(dashboardId),
    enabled: !!dashboardId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDashboards() {
  return useQuery({
    queryKey: ['dashboards'],
    queryFn: async () => {
      console.log('useDashboards - Starting API call');
      const result = await getDashboards();
      console.log('useDashboards - API result:', result);
      return result || []; // Ensure we never return undefined
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useSaveDashboard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dashboardData: SaveDashboardRequest) => saveDashboard(dashboardData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch dashboard-related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'structure', variables.id] })
      
      // Optionally, you can also update the cache directly
      queryClient.setQueryData(['dashboard', variables.id], data)
    },
    onError: (error) => {
      console.error('Failed to save dashboard:', error)
    }
  })
}

// Save Draft Hook
export function useSaveDraft() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ dashboardId, draftData }: { dashboardId: string; draftData: any }) => 
      saveDraft(dashboardId, draftData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries after successful save
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'structure', variables.dashboardId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      console.error('Failed to save draft:', error)
    }
  })
}

// Publish Draft Hook
export function usePublishDraft() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dashboardId: string) => publishDraft(dashboardId),
    onSuccess: (data, dashboardId) => {
      // Invalidate relevant queries after successful publish
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'structure', dashboardId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
    },
    onError: (error) => {
      console.error('Failed to publish draft:', error)
    }
  })
}

// Component Execution Hook
export function useExecuteComponent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (params: ComponentExecuteRequest) => executeComponent(params),
    onSuccess: (data, variables) => {
      // Invalidate widget data for the specific component
      queryClient.invalidateQueries({ 
        queryKey: ['widget-data', variables.companyId, variables.refId] 
      })
    },
    onError: (error) => {
      console.error('Failed to execute component:', error)
    }
  })
}

// Comprehensive Dashboard Hook using React Query
export function useDashboard(dashboardId?: string) {
  const [currentTabId, setCurrentTabId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<'draft' | 'published'>('published')
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set())

  // Fetch dashboard structure
  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure
  } = useDashboardStructure(dashboardId || '')

  // Get current tab widgets
  const currentTab = useMemo(() => {
    if (!structure || !currentTabId) return null
    // View mode: always show published version if it exists
    // Edit mode: always show draft version
    if (isEditing) {
      return structure.draftVersion?.tabs.find(tab => tab.id === currentTabId) || null
    } else {
      // View mode - show published version if it exists, otherwise draft
      const activeVersion = structure.publishedVersion || structure.draftVersion
      return activeVersion?.tabs.find(tab => tab.id === currentTabId) || null
    }
  }, [structure, currentTabId, isEditing])

  // Mutations
  const saveDraftMutation = useSaveDraft()
  const publishDraftMutation = usePublishDraft()

  // Set initial tab when structure loads
  const initializeTab = useCallback(() => {
    if (structure && !currentTabId) {
      // View mode: always show published version if it exists
      // Edit mode: always show draft version
      if (isEditing) {
        // Edit mode - show draft version
        if (structure.draftVersion?.tabs[0]) {
          setCurrentTabId(structure.draftVersion.tabs[0].id)
          setCurrentVersion('draft')
        }
      } else {
        // View mode - show published version if it exists, otherwise draft
        const activeVersion = structure.publishedVersion || structure.draftVersion
        const firstTab = activeVersion?.tabs[0]
        if (firstTab) {
          setCurrentTabId(firstTab.id)
          setCurrentVersion(structure.publishedVersion ? 'published' : 'draft')
          // If we're showing draft version, automatically switch to edit mode
          if (!structure.publishedVersion) {
            setIsEditing(true)
          }
        }
      }
    }
  }, [structure, currentTabId, isEditing])

  // Switch tab
  const switchTab = useCallback((tabId: string) => {
    setCurrentTabId(tabId)
    setLoadedTabs(prev => new Set([...prev, tabId]))
  }, [])

  // Switch to draft version
  const switchToDraft = useCallback(() => {
    if (!structure?.draftVersion) {
      console.warn('No draft version available')
      return
    }
    setCurrentVersion('draft')
    setIsEditing(true)
    // Reset current tab to first tab of draft version
    if (structure.draftVersion.tabs[0]) {
      setCurrentTabId(structure.draftVersion.tabs[0].id)
    }
  }, [structure])

  // Switch to published version
  const switchToPublished = useCallback(() => {
    if (!structure?.publishedVersion) {
      console.warn('No published version available')
      return
    }
    setCurrentVersion('published')
    setIsEditing(false)
    // Reset current tab to first tab of published version
    if (structure.publishedVersion.tabs[0]) {
      setCurrentTabId(structure.publishedVersion.tabs[0].id)
    }
  }, [structure])

  // Save draft
  const saveDraft = useCallback(async (draftData: any) => {
    if (!dashboardId) throw new Error('Dashboard ID is required')
    return saveDraftMutation.mutateAsync({ dashboardId, draftData })
  }, [dashboardId, saveDraftMutation])

  // Publish draft
  const publishDraft = useCallback(async () => {
    if (!dashboardId) throw new Error('Dashboard ID is required')
    return publishDraftMutation.mutateAsync(dashboardId)
  }, [dashboardId, publishDraftMutation])

  // Current tab widgets
  const currentTabWidgets = useMemo(() => {
    if (!currentTab) return []
    
    return currentTab.widgets.map(widget => ({
      ...widget,
      data: null // Widget data is no longer fetched via API
    }))
  }, [currentTab])

  // Determine permissions based on structure
  const canEdit = useMemo(() => {
    return !!structure?.draftVersion
  }, [structure])

  const canPublish = useMemo(() => {
    return isEditing && !!structure?.draftVersion
  }, [isEditing, structure])

  // Determine which version to show by default
  const defaultVersion = useMemo(() => {
    if (!structure) return 'draft'
    return structure.publishedVersion ? 'published' : 'draft'
  }, [structure])

  // Initialize tab when structure loads
  useEffect(() => {
    initializeTab()
  }, [initializeTab])

  return {
    // State
    structure,
    currentTabId,
    currentTabWidgets,
    loading: {
      structure: structureLoading
    },
    error: structureError,
    loadedTabs,
    isEditing,
    currentVersion,
    canEdit,
    canPublish,

    // Actions
    switchTab,
    setIsEditing,
    switchToDraft,
    switchToPublished,
    saveDraft,
    publishDraft,
    refetchStructure,

    // Mutation states
    isSavingDraft: saveDraftMutation.isPending,
    isPublishing: publishDraftMutation.isPending,
  }
} 