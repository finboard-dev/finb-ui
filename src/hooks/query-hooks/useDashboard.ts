import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createDashboard, getDashboardStructure, getDashboards, saveDashboard } from '@/lib/api/dashboard'
import type { CreateDashboardRequest, SaveDashboardRequest } from '@/lib/api/dashboard'

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