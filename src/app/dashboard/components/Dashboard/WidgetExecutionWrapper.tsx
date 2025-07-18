"use client";

import React from "react";
import { useComponentExecution } from "@/hooks/query-hooks/useComponentExecution";
import { Block } from "../../types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetExecutionWrapperProps {
  block: Block;
  currentTabStartDate: string;
  currentTabEndDate: string;
  children: (executionData: any) => React.ReactNode;
  className?: string;
}

export default function WidgetExecutionWrapper({
  block,
  currentTabStartDate,
  currentTabEndDate,
  children,
  className,
}: WidgetExecutionWrapperProps) {
  const {
    data: executionData,
    isLoading,
    error,
    isError,
  } = useComponentExecution({
    refId: block.id, // Use block.id as refId
    refVersion: block.refVersion || "latest",
    refType: block.refType || "METRIC",
    startDate: currentTabStartDate,
    endDate: currentTabEndDate,
    enabled: true, // Always execute when component is rendered
  });

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500 font-medium">
            Executing {block.title}...
          </span>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-red-50 rounded-lg border border-red-200",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">!</span>
          </div>
          <span className="text-sm text-red-600 font-medium">
            Failed to execute {block.title}
          </span>
          {error && (
            <span className="text-xs text-red-500 text-center max-w-full truncate">
              {error.message || "Unknown error occurred"}
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

  // Fallback to original children if no execution data
  console.log(`⚠️ Widget ${block.title} using fallback content:`, {
    originalContent: block.content,
    executionData: executionData,
  });
  return <>{children(block.content)}</>;
}
