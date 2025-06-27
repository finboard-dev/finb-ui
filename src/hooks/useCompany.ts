import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllCompany, getCurrentCompany } from '@/lib/api/allCompany'

export function useAllCompanies() {
  return useQuery({
    queryKey: ['companies', 'all'],
    queryFn: getAllCompany,
    retry: 1,
  })
}

export function useCurrentCompany(companyId: string) {
  return useQuery({
    queryKey: ['company', 'current', companyId],
    queryFn: () => getCurrentCompany(companyId),
    retry: 1,
    enabled: !!companyId,
  })
}

export function useSetCurrentCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: getCurrentCompany,
    onSuccess: (data, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['company', 'current', companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies', 'all'] })
    },
  })
} 