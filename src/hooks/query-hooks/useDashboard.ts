import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createDashboard, getDashboardStructure, getDashboards } from '@/lib/api/dashboard'
import type { CreateDashboardRequest } from '@/lib/api/dashboard'

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
    queryFn: getDashboards,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
} 