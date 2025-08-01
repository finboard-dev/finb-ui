'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMonthYear, getLastDayOfMonth } from '../../utils/dateUtils';

interface DateRangePickerProps {
  dateRange: { start?: Date; end?: Date };
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
  onApply: () => void;
  onReset?: () => void;
  hasChanges: boolean;
  originalDateRange?: { start?: Date; end?: Date };
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  onApply,
  onReset,
  hasChanges,
  originalDateRange,
}: DateRangePickerProps) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = new Date(viewYear, monthIndex);

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // Start new selection - set to 1st of the month
      const startDate = new Date(viewYear, monthIndex, 1);
      onDateRangeChange({ start: startDate, end: undefined });
    } else if (dateRange.start && !dateRange.end) {
      // Complete the range - set end to last day of the month
      if (selectedDate >= dateRange.start) {
        const lastDay = getLastDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), lastDay);
        onDateRangeChange({ ...dateRange, end: endDate });
      } else {
        // If selected date is before start, make it the new start and set end to last day of original start month
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const lastDay = getLastDayOfMonth(dateRange.start.getFullYear(), dateRange.start.getMonth());
        const endDate = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), lastDay);
        onDateRangeChange({ start: startDate, end: endDate });
      }
    }
  };

  const getMonthStatus = (monthIndex: number) => {
    const currentDate = new Date(viewYear, monthIndex);

    if (!dateRange.start) return 'default';

    const startTime = dateRange.start.getTime();
    const currentTime = currentDate.getTime();

    if (dateRange.start && !dateRange.end) {
      if (currentTime === startTime) return 'start';
      return 'default';
    }

    if (dateRange.start && dateRange.end) {
      const endTime = dateRange.end.getTime();

      if (currentTime === startTime) return 'start';
      if (currentTime === endTime) return 'end';
      if (currentTime > startTime && currentTime < endTime) return 'in-range';
    }

    return 'default';
  };

  const getMonthButtonClass = (status: string) => {
    switch (status) {
      case 'start':
        return 'bg-primary text-white hover:bg-primary/90 hover:text-white shadow-md';
      case 'end':
        return 'bg-primary text-white hover:bg-primary/90 hover:text-white shadow-md';
      case 'in-range':
        return 'bg-white text-primary hover:bg-primary/20 hover:text-white border-primary/20';
      default:
        return '!bg-white text-gray-900 hover:bg-gray-100 border-gray-200';
    }
  };

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

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => setViewYear(viewYear - 1)} className="hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-bold text-lg text-gray-900">{viewYear}</div>
        <Button variant="outline" size="sm" onClick={() => setViewYear(viewYear + 1)} className="hover:bg-gray-100">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {months.map((month, index) => {
          const status = getMonthStatus(index);

          return (
            <Button
              key={month}
              variant="ghost"
              size="sm"
              onClick={() => handleMonthSelect(index)}
              className={cn(
                'h-12 text-sm font-medium border transition-all duration-200 hover:shadow-md',
                getMonthButtonClass(status)
              )}
            >
              {month.slice(0, 3)}
            </Button>
          );
        })}
      </div>

      {(dateRange.start || dateRange.end) && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {dateRange.start && dateRange.end ? 'Range selected' : 'Select end date'}
          </div>
        </div>
      )}

      {/* Date range preview */}
      {dateRange.start && dateRange.end && (
        <div className="text-sm text-muted-foreground mb-4">
          Duration: {Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      )}

      {/* Apply and Reset buttons */}
      {hasChanges && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <Button variant="outline" onClick={onReset} className="flex-1 bg-transparent" disabled={!originalDateRange}>
            Reset
          </Button>
          <Button onClick={onApply} className="flex-1 text-white">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
