'use client';

import React from 'react';
import {
  RefreshCw,
  AlertCircle,
  GripVerticalIcon,
  MoreVerticalIcon,
  Edit3Icon,
  CopyIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoDataDisplayProps {
  title?: string;
  message?: string;
  onRefetch?: () => void;
  isRefetching?: boolean;
  className?: string;
  showDragHandle?: boolean;
  dragHandleProps?: React.HTMLProps<HTMLDivElement>;
  showMenu?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export default function NoDataDisplay({
  title = 'No Data Available',
  message = 'This component has no data to display.',
  onRefetch,
  isRefetching = false,
  className,
  showDragHandle,
  dragHandleProps,
  showMenu,
  onDelete,
  onEdit,
  onDuplicate,
}: NoDataDisplayProps) {
  const onDeleteHandler = React.useCallback(() => onDelete?.(), [onDelete]);
  const onEditHandler = React.useCallback(() => onEdit?.(), [onEdit]);
  const onDuplicateHandler = React.useCallback(() => onDuplicate?.(), [onDuplicate]);

  return (
    <div
      className={cn(
        'flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden',
        'min-w-[160px] min-h-[100px]',
        className,
        showDragHandle ? 'rounded-none' : 'rounded-lg'
      )}
    >
      {/* Header Section - Compact */}
      {(showDragHandle || showMenu || title) && (
        <div className="flex items-center justify-between px-3 py-2 bg-white border-slate-200 flex-shrink-0 min-h-[40px]">
          <div className="flex items-center gap-1.5 flex-grow min-w-0">
            {showDragHandle && (
              <div
                {...dragHandleProps}
                className={cn(
                  'flex items-center text-slate-400 hover:text-slate-600 p-0.5 cursor-grab active:cursor-grabbing flex-shrink-0',
                  dragHandleProps?.className
                )}
              >
                <GripVerticalIcon className="h-4 w-4" />
              </div>
            )}
            <h3 className="text-xs font-medium text-slate-600 truncate leading-tight" title={title}>
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
              <DropdownMenuContent align="end" className="bg-white shadow-xl border-slate-200 z-[100] rgl-no-drag">
                {onEdit && (
                  <DropdownMenuItem onClick={onEditHandler} className="text-sm">
                    <Edit3Icon className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicateHandler} className="text-sm">
                    <CopyIcon className="w-3.5 h-3.5 mr-2" /> Duplicate
                  </DropdownMenuItem>
                )}
                {(onEdit || onDuplicate) && onDelete && <DropdownMenuSeparator className="bg-slate-200" />}
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

      {/* Content Section */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 bg-gray-50 min-h-[60px]">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-700">No Data Available</h3>
            <p className="text-xs text-gray-500 max-w-xs">{message}</p>
          </div>

          {onRefetch && (
            <Button variant="outline" size="sm" onClick={onRefetch} disabled={isRefetching} className="mt-2">
              <RefreshCw className={cn('w-3 h-3 mr-1', isRefetching && 'animate-spin')} />
              {isRefetching ? 'Refetching...' : 'Refetch Data'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
