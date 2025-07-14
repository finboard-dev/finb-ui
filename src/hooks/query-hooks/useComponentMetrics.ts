import { useMutation, useQueryClient } from '@tanstack/react-query'
import { publishComponentMetrics } from '@/lib/api/metrics'

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