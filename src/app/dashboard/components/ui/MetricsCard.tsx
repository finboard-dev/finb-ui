"use client";

import type React from "react";

import { useCallback, useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  Edit3Icon,
  CopyIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  formatValue?: (value: number | string) => string;
  className?: string;
  style?: React.CSSProperties;
  showDragHandle?: boolean;
  dragHandleProps?: React.HTMLProps<HTMLDivElement>;
  showMenu?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export default function MetricsCard({
  title,
  value,
  change,
  changeLabel,
  formatValue = (val) => val.toString(),
  className,
  style,
  showDragHandle,
  dragHandleProps,
  showMenu,
  onDelete,
  onEdit,
  onDuplicate,
}: MetricsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  // Professional value formatting
  const formattedValue = useMemo(() => {
    if (typeof value === "number") {
      // Currency formatting
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      } else if (value < 1 && value > 0) {
        return value.toFixed(2);
      }
      return `$${value.toLocaleString("en-US")}`;
    }
    return String(value);
  }, [value]);

  const formattedChange = change ? Math.abs(change).toFixed(1) : null;

  const onDeleteHandler = useCallback(() => onDelete?.(), [onDelete]);
  const onEditHandler = useCallback(() => onEdit?.(), [onEdit]);
  const onDuplicateHandler = useCallback(() => onDuplicate?.(), [onDuplicate]);

  return (
    <div
      className={cn(
        "flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden",
        "min-w-[160px] min-h-[100px]", // Reduced minimum dimensions
        className,
        showDragHandle ? "rounded-none" : "rounded-lg"
      )}
      style={{
        ...style,
        minWidth: Math.max(160, (style?.minWidth as number) || 0),
        minHeight: Math.max(100, (style?.minHeight as number) || 0),
      }}
    >
      {/* Header Section - Compact */}
      {(showDragHandle || showMenu || title) && (
        <div className="flex items-center justify-between px-3 py-2 bg-white border-slate-200 flex-shrink-0 min-h-[40px]">
          <div className="flex items-center gap-1.5 flex-grow min-w-0">
            {showDragHandle && (
              <div
                {...dragHandleProps}
                className={cn(
                  "flex items-center text-slate-400 hover:text-slate-600 p-0.5 cursor-grab active:cursor-grabbing flex-shrink-0",
                  dragHandleProps?.className
                )}
              >
                <GripVerticalIcon className="h-4 w-4" />
              </div>
            )}
            <h3
              className="text-xs font-medium text-slate-600 truncate leading-tight"
              title={title}
            >
              {title}
            </h3>
          </div>
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition-colors duration-150 cursor-pointer rgl-no-drag flex-shrink-0"
                  aria-label="More options"
                >
                  <MoreVerticalIcon className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white shadow-xl border-slate-200 z-[100] rgl-no-drag"
              >
                {onEdit && (
                  <DropdownMenuItem onClick={onEditHandler} className="text-sm">
                    <Edit3Icon className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={onDuplicateHandler}
                    className="text-sm"
                  >
                    <CopyIcon className="w-3.5 h-3.5 mr-2" /> Duplicate
                  </DropdownMenuItem>
                )}
                {(onEdit || onDuplicate) && onDelete && (
                  <DropdownMenuSeparator className="bg-slate-200" />
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDeleteHandler}
                    className="text-sm text-red-600 hover:!text-red-500 hover:!bg-red-50 focus:!bg-red-50 focus:!text-red-600"
                  >
                    <Trash2Icon className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Content Section - Left Aligned, Professional */}
      <div className="flex-grow flex flex-col justify-center px-3 py-3 min-h-[60px] overflow-hidden">
        {/* Main Value - Left Aligned */}
        <div className="w-full">
          <div
            className="text-2xl font-bold text-slate-900 leading-none truncate"
            title={formattedValue}
          >
            {formattedValue}
          </div>
        </div>

        {/* Change Indicator - Left Aligned */}
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center text-sm font-medium mt-1.5 w-full",
              isPositive && "text-emerald-600",
              isNegative && "text-red-600",
              change === 0 && "text-slate-500"
            )}
          >
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpIcon className="w-3.5 h-3.5 flex-shrink-0" />
              ) : isNegative ? (
                <ArrowDownIcon className="w-3.5 h-3.5 flex-shrink-0" />
              ) : null}
              <span className="text-sm">
                {formattedChange}%
                {changeLabel && (
                  <span className="ml-1 text-slate-500 text-xs">
                    {changeLabel}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
