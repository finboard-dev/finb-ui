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
      // Invalidate and refetch the specific component execution query
      const queryKey = ['component-execution', variables.refId, variables.refVersion, variables.refType, variables.startDate, variables.endDate];
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Component execution failed:', error);
    },
  });
}; 