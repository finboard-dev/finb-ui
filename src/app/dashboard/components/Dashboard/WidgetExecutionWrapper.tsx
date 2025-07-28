'use client';

import React from 'react';
import { useComponentExecution } from '@/hooks/query-hooks/useComponentExecution';
import { Block } from '../../types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import NoDataDisplay from './NoDataDisplay';
import { useExecuteComponentMutation } from '@/hooks/query-hooks/useComponentExecution';
import { getCompanyId } from '@/lib/utils/helpers';
import { toast } from 'sonner';

interface WidgetExecutionWrapperProps {
  block: Block;
  currentTabStartDate: string;
  currentTabEndDate: string;
  children: (executionData: any) => React.ReactNode;
  className?: string;
  showDragHandle?: boolean;
  dragHandleProps?: React.HTMLProps<HTMLDivElement>;
  showMenu?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export default function WidgetExecutionWrapper({
  block,
  currentTabStartDate,
  currentTabEndDate,
  children,
  className,
  showDragHandle,
  dragHandleProps,
  showMenu,
  onDelete,
  onEdit,
  onDuplicate,
}: WidgetExecutionWrapperProps) {
  const executeComponentMutation = useExecuteComponentMutation();

  // Try to use a specific version number instead of "latest"
  const versionToUse = block.refVersion === 'latest' ? '1' : block.refVersion || '1';

  const {
    data: executionData,
    isLoading,
    error,
    isError,
    refetch,
  } = useComponentExecution({
    refId: block.id, // Use block.id as refId
    refVersion: versionToUse,
    refType: block.refType || 'METRIC',
    startDate: currentTabStartDate,
    endDate: currentTabEndDate,
    enabled: true, // Always execute when component is rendered
  });

  // Debug: Log the block version info
  console.log(`🔍 Block version info for ${block.title}:`, {
    refId: block.id,
    refVersion: block.refVersion,
    refType: block.refType,
    usingVersion: versionToUse,
    fullBlock: block,
  });

  // Add a ref to track if we're currently refetching
  const isRefetchingRef = React.useRef(false);

  const handleRefetch = React.useCallback(async () => {
    if (!block) {
      console.error('Missing block data for refetch');
      return;
    }

    // Prevent multiple simultaneous refetch calls
    if (executeComponentMutation.isPending || isRefetchingRef.current) {
      console.log('Refetch already in progress, skipping...');
      return;
    }

    // Set refetching flag
    isRefetchingRef.current = true;

    const companyId = getCompanyId();
    if (!companyId) {
      console.error('Company ID is required for component execution');
      return;
    }

    // Try to use a specific version number instead of "latest"
    // If refVersion is "latest", try using "1" as a fallback
    const versionToUse = block.refVersion === 'latest' ? '1' : block.refVersion || '1';

    try {
      console.log(`🔄 Refetching component data for:`, {
        refId: block.id,
        originalRefVersion: block.refVersion,
        usingVersion: versionToUse,
        refType: block.refType || 'METRIC',
        startDate: currentTabStartDate,
        endDate: currentTabEndDate,
        companyId,
      });

      const result = await executeComponentMutation.mutateAsync({
        refId: block.id,
        refVersion: versionToUse,
        refType: block.refType || 'METRIC',
        startDate: currentTabStartDate,
        endDate: currentTabEndDate,
        companyId,
      });

      console.log(`✅ Refetch successful for ${block.title}:`, {
        hasOutput: !!result.output,
        outputType: result.outputType,
        error: result.error,
      });

      if (result.error) {
        toast.error(`Component error: ${result.error}`);
        return; // Don't proceed if there's an error
      } else if (!result.output) {
        toast.warning(`No data returned for ${block.title}`);
        return; // Don't proceed if there's no output
      } else {
        toast.success(`Refreshed data for ${block.title}`);
        // Small delay to ensure cache update propagates
        setTimeout(async () => {
          try {
            await refetch();
          } catch (refetchError: any) {
            // Handle refetch errors gracefully
            if (refetchError?.code === 'ERR_CANCELED' || refetchError?.message === 'canceled') {
              console.log('Refetch was canceled - this is normal');
            } else {
              console.error('Refetch failed:', refetchError);
            }
          }
        }, 100);
      }
    } catch (error: any) {
      // Handle canceled requests gracefully
      if (error?.code === 'ERR_CANCELED' || error?.message === 'canceled') {
        console.log(`Refetch for ${block.title} was canceled - this is normal behavior`);
        return; // Don't show error toast for canceled requests
      }

      console.error('Failed to refresh component data:', error);
      toast.error(`Failed to refresh ${block.title}: ${error.message || 'Unknown error'}`);
    } finally {
      // Always reset the refetching flag
      isRefetchingRef.current = false;
    }
  }, [block, currentTabStartDate, currentTabEndDate, executeComponentMutation, refetch]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500 font-medium">Executing {block.title}...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div
        className={cn(
          'w-full h-full flex flex-col items-center justify-center bg-red-50 rounded-lg border border-red-200',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">!</span>
          </div>
          <span className="text-sm text-red-600 font-medium">Failed to execute {block.title}</span>
          {error && (
            <span className="text-xs text-red-500 text-center max-w-full truncate">
              {error.message || 'Unknown error occurred'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // If execution was successful, render the children with the execution output
  if (executionData?.output) {
    console.log(`✅ Widget ${block.title} execution successful:`, {
      originalContent: block.content,
      executionOutput: executionData.output,
      outputType: executionData.outputType,
    });
    return <>{children(executionData.output)}</>;
  }

  // Check if we have no data available
  const hasNoData = !executionData?.output && !block.content;

  console.log(`🔍 Widget ${block.title} state check:`, {
    hasExecutionData: !!executionData?.output,
    hasBlockContent: !!block.content,
    hasNoData,
    executionDataOutput: executionData?.output,
    blockContent: block.content,
    isRefetching: executeComponentMutation.isPending,
  });

  if (hasNoData) {
    console.log(`⚠️ Widget ${block.title} has no data available`);
    return (
      <NoDataDisplay
        title={block.title}
        message={`${block.title} has no data to display.`}
        onRefetch={handleRefetch}
        isRefetching={executeComponentMutation.isPending}
        className={className}
        showDragHandle={showDragHandle}
        dragHandleProps={dragHandleProps}
        showMenu={showMenu}
        onDelete={onDelete}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
      />
    );
  }

  // Fallback to original children if no execution data
  console.log(`⚠️ Widget ${block.title} using fallback content:`, {
    originalContent: block.content,
    executionData: executionData,
  });
  return <>{children(block.content)}</>;
}
