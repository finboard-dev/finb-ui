import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createDashboard, getDashboardStructure, getDashboards, saveDashboard, getWidgetData, saveDraft, publishDraft } from '@/lib/api/dashboard'
import type { CreateDashboardRequest, SaveDashboardRequest, WidgetDataRequest } from '@/lib/api/dashboard'

export function useCreateDashboard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dashboardData: CreateDashboardRequest) => createDashboard(dashboardData),
    onSuccess: (data) => {
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
    retry: 1,
    enabled: !!dashboardId,
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
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Widget Data Hook
export function useWidgetData(params: WidgetDataRequest) {
  return useQuery({
    queryKey: ['widget-data', params.dashboardId, params.componentId, params.tabId],
    queryFn: () => getWidgetData(params),
    enabled: !!params.dashboardId && !!params.componentId && !!params.tabId,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
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