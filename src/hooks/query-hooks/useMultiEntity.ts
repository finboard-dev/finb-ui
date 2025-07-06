import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMultiEntity, deleteMultiEntity } from '@/lib/api/multiEntity'

export function useCreateMultiEntity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createMultiEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['company', 'current'] })
    },
  })
}

export function useDeleteMultiEntity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteMultiEntity,
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['companies', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['company', 'current', companyId] })
    },
  })
} 