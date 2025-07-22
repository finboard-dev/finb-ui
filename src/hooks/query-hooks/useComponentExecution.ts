import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeComponent, ComponentExecuteRequest, ComponentExecuteResponse } from '@/lib/api/dashboard';
import { getCompanyId } from '@/lib/utils/helpers';

export interface UseComponentExecutionOptions {
  refId: string;
  refVersion: string;
  refType: string;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export const useComponentExecution = (options: UseComponentExecutionOptions) => {
  const { refId, refVersion, refType, startDate, endDate, enabled = true } = options;
  const queryClient = useQueryClient();

  const queryKey = ['component-execution', refId, refVersion, refType, startDate, endDate];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ComponentExecuteResponse> => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID is required for component execution');
      }

      const request: ComponentExecuteRequest = {
        refId,
        refVersion,
        refType,
        startDate,
        endDate,
        companyId,
      };

      console.log(`🚀 Executing component:`, {
        refId,
        refVersion,
        refType,
        startDate,
        endDate,
        companyId
      });

      const result = await executeComponent(request);
      
      console.log(`📊 Component execution result:`, {
        refId,
        executionId: result.executionId,
        hasOutput: !!result.output,
        outputType: result.outputType,
        error: result.error,
        executionTimeMs: result.executionTimeMs
      });

      return result;
    },
    enabled: enabled && !!refId && !!refVersion && !!refType && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useExecuteComponentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ComponentExecuteRequest): Promise<ComponentExecuteResponse> => {
      return executeComponent(params);
    },
    onSuccess: (data, variables) => {
      // Immediately update the cache with the new data
      const queryKey = ['component-execution', variables.refId, variables.refVersion, variables.refType, variables.startDate, variables.endDate];
      queryClient.setQueryData(queryKey, data);
      
      // Also invalidate to ensure any other related queries are updated
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      // Check if it's a canceled request
      if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
        console.log('Component execution request was canceled - this is normal behavior');
        return; // Don't log this as an error since it's expected
      }
      console.error('Component execution failed:', error);
    },
    // Prevent multiple simultaneous mutations
    retry: false,
    retryDelay: 0,
  });
}; 