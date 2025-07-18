import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/lib/api/reports';
import { getCompanyId } from '@/lib/utils/helpers';

export function useReports() {
  const companyId = getCompanyId();
  
  return useQuery({
    queryKey: ['reports', companyId],
    queryFn: () => getReports(companyId!),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!companyId, // Only run query if companyId exists
  });
} 