import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useExecuteComponentMutation } from '@/hooks/query-hooks/useComponentExecution';
import { getCompanyId } from '@/lib/utils/helpers';

interface UseDashboardDateControlsProps {
  currentTabStartDate?: string;
  currentTabEndDate?: string;
  currentTabId?: string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function useDashboardDateControls({
  currentTabStartDate,
  currentTabEndDate,
  currentTabId,
  onDateRangeChange,
}: UseDashboardDateControlsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const executeComponentMutation = useExecuteComponentMutation();

  // Update last refreshed time when component execution completes
  useEffect(() => {
    if (executeComponentMutation.isSuccess) {
      setLastRefreshedAt(new Date().toISOString());
    }
  }, [executeComponentMutation.isSuccess]);

  const handleDateRangeChange = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        // Call the parent callback if provided
        if (onDateRangeChange) {
          onDateRangeChange(startDate, endDate);
        }

        // Invalidate all component execution queries to force refetch with new dates
        queryClient.invalidateQueries({ queryKey: ['component-execution'] });

        toast.success('Date range updated successfully');
      } catch (error) {
        console.error('Error updating date range:', error);
        toast.error('Failed to update date range');
      }
    },
    [onDateRangeChange, queryClient]
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);

      // Invalidate all component execution queries to force refetch
      await queryClient.invalidateQueries({ queryKey: ['component-execution'] });

      // Update last refreshed time
      setLastRefreshedAt(new Date().toISOString());

      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, queryClient]);

  return {
    isRefreshing,
    lastRefreshedAt,
    handleDateRangeChange,
    handleRefresh,
  };
} 