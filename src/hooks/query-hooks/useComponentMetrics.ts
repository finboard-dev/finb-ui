import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { publishComponentMetrics, getComponentMetrics } from '@/lib/api/metrics'

export function usePublishComponentMetrics() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ componentId, data }: { componentId: string; data: any }) => 
      publishComponentMetrics(componentId, data),
    onSuccess: () => {
      // Invalidate relevant queries after successful publish
      queryClient.invalidateQueries({ queryKey: ['component-metrics'] })
    },
  })
}

export function useComponentMetrics(orgId: string, companyId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['component-metrics', orgId, companyId],
    queryFn: () => getComponentMetrics({ orgId, companyId, publishedOnly: true }),
    enabled: enabled && !!orgId && !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on cancellation errors
      if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  })
} 