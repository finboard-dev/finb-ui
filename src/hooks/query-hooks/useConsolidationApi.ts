import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consolidationApi } from '@/lib/api/consolidation';

export function useChartOfAccounts(id: string) {
  return useQuery({
    queryKey: ['chartOfAccounts', id],
    queryFn: () => consolidationApi.getChartOfAccounts(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMappingForAccountByType(id: string, type: string) {
  return useQuery({
    queryKey: ['accountMapping', id, type],
    queryFn: () => consolidationApi.getMappingForAccountByType(id, type),
    enabled: !!id && !!type,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => consolidationApi.saveMappings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountMapping'] });
    },
  });
}