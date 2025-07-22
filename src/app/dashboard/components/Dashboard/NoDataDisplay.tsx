"use client";

import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoDataDisplayProps {
  title?: string;
  message?: string;
  onRefetch?: () => void;
  isRefetching?: boolean;
  className?: string;
}

export default function NoDataDisplay({
  title = "No Data Available",
  message = "This component has no data to display.",
  onRefetch,
  isRefetching = false,
  className,
}: NoDataDisplayProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-gray-400" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <p className="text-xs text-gray-500 max-w-xs">{message}</p>
        </div>

        {onRefetch && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isRefetching}
            className="mt-2"
          >
            <RefreshCw
              className={cn("w-3 h-3 mr-1", isRefetching && "animate-spin")}
            />
            {isRefetching ? "Refetching..." : "Refetch Data"}
          </Button>
        )}
      </div>
    </div>
  );
}
