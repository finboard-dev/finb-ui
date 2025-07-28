'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './DateRangePicker';
import { format } from 'date-fns';
import { formatLastRefreshed, formatMonthYear, formatToYYYYMMDD } from '../../utils/dateUtils';

interface DashboardDateControlsProps {
  currentTabStartDate?: string;
  currentTabEndDate?: string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  lastRefreshedAt?: string | null;
  isEditing?: boolean;
  // New props for frontend filter functionality
  onExecuteWithNewDates?: (startDate: string, endDate: string) => void;
}

export default function DashboardDateControls({
  currentTabStartDate,
  currentTabEndDate,
  onDateRangeChange,
  onRefresh,
  isLoading = false,
  lastRefreshedAt,
  isEditing = false,
  onExecuteWithNewDates,
}: DashboardDateControlsProps) {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [originalDateRange, setOriginalDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize date range from props
  useEffect(() => {
    if (currentTabStartDate && currentTabEndDate) {
      const startDate = new Date(currentTabStartDate);
      const endDate = new Date(currentTabEndDate);
      const newDateRange = { start: startDate, end: endDate };
      setDateRange(newDateRange);
      setOriginalDateRange(newDateRange);
      setHasChanges(false);
    }
  }, [currentTabStartDate, currentTabEndDate]);

  const formatRange = () => {
    if (dateRange.start && dateRange.end) {
      return (
        <div className="flex items-center gap-2">
          <span>{formatMonthYear(dateRange.start)}</span>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span>{formatMonthYear(dateRange.end)}</span>
        </div>
      );
    } else if (dateRange.start) {
      return `From ${formatMonthYear(dateRange.start)}`;
    } else if (dateRange.end) {
      return `Until ${formatMonthYear(dateRange.end)}`;
    }
    return 'Select date range';
  };

  const handleDateRangeChange = (newRange: { start?: Date; end?: Date }) => {
    setDateRange(newRange);

    // Check if the new range is different from the original range
    const originalStart = originalDateRange.start;
    const originalEnd = originalDateRange.end;

    const hasChanged =
      newRange.start?.getTime() !== originalStart?.getTime() || newRange.end?.getTime() !== originalEnd?.getTime();

    setHasChanges(hasChanged);
  };

  const handleApply = () => {
    if (dateRange.start && dateRange.end) {
      // Format dates as YYYY-MM-DD with proper start/end logic
      const startDate = formatToYYYYMMDD(dateRange.start, false); // 1st of month
      const endDate = formatToYYYYMMDD(dateRange.end, true); // Last day of month

      // Trigger frontend filter - no backend save
      if (onExecuteWithNewDates) {
        onExecuteWithNewDates(startDate, endDate);
      }

      // Update original range to current selection
      setOriginalDateRange(dateRange);
      setHasChanges(false);
      setIsDatePickerOpen(false);
    }
  };

  const handleReset = () => {
    if (originalDateRange.start && originalDateRange.end) {
      setDateRange(originalDateRange);
      setHasChanges(false);

      // Trigger execute with original dates
      if (onExecuteWithNewDates) {
        const startDate = formatToYYYYMMDD(originalDateRange.start, false);
        const endDate = formatToYYYYMMDD(originalDateRange.end, true);
        onExecuteWithNewDates(startDate, endDate);
      }
    }
  };

  return (
    <div className={cn('px-4 py-3', isEditing ? 'bg-slate-50' : 'bg-slate-100')}>
      <div className="flex items-center justify-between">
        {/* Left side - Date Range Picker */}
        <div className="flex items-center gap-3">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'bg-white hover:bg-gray-50 text-gray-900 px-3 h-9 rounded-md border-gray-300 flex items-center gap-2 text-sm font-medium hover:shadow-md transition-all duration-200',
                  hasChanges && 'border-blue-500 bg-blue-50',
                  isEditing && 'border-slate-300 hover:border-slate-400'
                )}
              >
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>{formatRange()}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 shadow-xl border-2 border-gray-200" align="start">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                onApply={handleApply}
                onReset={handleReset}
                hasChanges={hasChanges}
                originalDateRange={originalDateRange}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Right side - Last Updated and Refresh */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Last updated: {formatLastRefreshed(lastRefreshedAt || null)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              'bg-white hover:bg-gray-50 text-gray-900 px-3 h-8 rounded-md border-gray-300 hover:shadow-md transition-all duration-200',
              isEditing && 'border-slate-300 hover:border-slate-400'
            )}
          >
            <RotateCcw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </div>
  );
}
