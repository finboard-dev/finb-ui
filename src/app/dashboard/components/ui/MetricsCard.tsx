"use client";

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
  style?: React.CSSProperties; // Added this line
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
  style, // Destructure style
  showDragHandle,
  dragHandleProps,
  showMenu,
  onDelete,
  onEdit,
  onDuplicate,
}: MetricsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  // Format the value for display
  const formattedValue = useMemo(() => {
    if (typeof value === "number") {
      return value.toLocaleString("en-IN"); // Format with commas for Indian locale
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
        className,
        showDragHandle ? "rounded-none" : "rounded-lg" // Make borders non-rounded when editing for dnd
      )}
      style={style} // Apply style here
    >
      {(showDragHandle || showMenu || title) && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 h-[45px]">
          {" "}
          {/* Consistent header height */}
          <div className="flex items-center gap-1.5 flex-grow min-w-0">
            {showDragHandle && (
              <div
                {...dragHandleProps}
                className={cn(
                  "flex items-center text-slate-400 hover:text-slate-600 p-0.5 cursor-grab active:cursor-grabbing",
                  dragHandleProps?.className
                )}
              >
                <GripVerticalIcon className="h-5 w-5" />
              </div>
            )}
            <h3
              className="text-sm font-semibold text-slate-700 truncate"
              title={title}
            >
              {title}
            </h3>
          </div>
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-md transition-colors duration-150 cursor-pointer rgl-no-drag"
                  aria-label="More options"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white shadow-xl border-slate-200 z-[100] rgl-no-drag"
              >
                {onEdit && (
                  <DropdownMenuItem
                    onClick={onEditHandler}
                    className="text-sm opt"
                  >
                    <Edit3Icon className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={onDuplicateHandler}
                    className="text-sm opt"
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
                    className="text-sm text-red-600 hover:!text-red-500 hover:!bg-red-50 focus:!bg-red-50 focus:!text-red-600 opt"
                  >
                    <Trash2Icon className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex-grow flex flex-col items-center justify-center p-4 min-h-[100px]" // Added min-h to prevent squishing
        )}
      >
        <span className="text-2xl font-semibold text-slate-900 leading-none">
          {" "}
          {/* Increased font size for value */}
          {formattedValue}
        </span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center text-sm font-medium mt-1", // Added margin-top for spacing
              isPositive && "text-emerald-600",
              isNegative && "text-red-600"
            )}
          >
            {isPositive ? (
              <ArrowUpIcon className="w-4 h-4 mr-0.5" />
            ) : isNegative ? (
              <ArrowDownIcon className="w-4 h-4 mr-0.5" />
            ) : null}
            {formattedChange}%
            {changeLabel && (
              <span className="ml-1 text-slate-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
