'use client';

import type React from 'react';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateDashboard } from '@/hooks/query-hooks/useDashboard';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dashboardId: string) => void;
}

interface DateRange {
  start?: Date;
  end?: Date;
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

export function CreateDashboardModal({ isOpen, onClose, onSuccess }: CreateDashboardModalProps) {
  const [title, setTitle] = useState('');
  const [range, setRange] = useState<DateRange>({});
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const createDashboardMutation = useCreateDashboard();

  // Debug logging for mutation state
  console.log('CreateDashboardModal - Mutation state:', {
    isPending: createDashboardMutation.isPending,
    isError: createDashboardMutation.isError,
    error: createDashboardMutation.error,
    data: createDashboardMutation.data,
  });

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRange = () => {
    if (range.start && range.end) {
      return (
        <div className="flex items-center gap-2">
          <span>{formatMonthYear(range.start)}</span>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span>{formatMonthYear(range.end)}</span>
        </div>
      );
    } else if (range.start) {
      return `From ${formatMonthYear(range.start)}`;
    } else if (range.end) {
      return `Until ${formatMonthYear(range.end)}`;
    }
    return 'Select date range';
  };

  // Get last day of month
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Format date to yyyy-mm-dd
  const formatToYYYYMMDD = (date: Date, isEndDate: boolean = false) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    let day = '01';

    if (isEndDate) {
      const lastDay = getLastDayOfMonth(date.getFullYear(), date.getMonth());
      day = String(lastDay).padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = new Date(viewYear, monthIndex);

    if (!range.start || (range.start && range.end)) {
      // Start new selection
      setRange({ start: selectedDate, end: undefined });
    } else if (range.start && !range.end) {
      // Complete the range
      if (selectedDate >= range.start) {
        setRange({ ...range, end: selectedDate });
        setOpen(false);
      } else {
        // If selected date is before start, make it the new start
        setRange({ start: selectedDate, end: range.start });
        setOpen(false);
      }
    }
  };

  const getMonthStatus = (monthIndex: number) => {
    const currentDate = new Date(viewYear, monthIndex);

    if (!range.start) return 'default';

    const startTime = range.start.getTime();
    const currentTime = currentDate.getTime();

    if (range.start && !range.end) {
      if (currentTime === startTime) return 'start';
      return 'default';
    }

    if (range.start && range.end) {
      const endTime = range.end.getTime();

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

  const clearRange = () => {
    setRange({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a dashboard title');
      return;
    }

    if (!range.start || !range.end) {
      toast.error('Please select both start and end dates');
      return;
    }

    // Validate that end date is after start date
    if (range.end <= range.start) {
      toast.error('End date must be after start date');
      return;
    }

    const startDate = formatToYYYYMMDD(range.start, false);
    const endDate = formatToYYYYMMDD(range.end, true);

    createDashboardMutation.mutate(
      {
        title: title.trim(),
        startDate,
        endDate,
        companyId: '', // Will be set by the API function
        orgId: '', // Will be set by the API function
      },
      {
        onSuccess: (result) => {
          console.log('CreateDashboardModal - Success:', result);

          // Validate that we have the expected data structure
          if (!result || !result.id) {
            console.error('Invalid response structure in modal:', result);
            toast.error('Dashboard created but response is invalid');
            return;
          }

          toast.success('Dashboard created successfully!');
          onSuccess?.(result.id);
          handleClose();
        },
        onError: (error) => {
          console.error('CreateDashboardModal - Error:', error);
          toast.error('Failed to create dashboard');
        },
      }
    );
  };

  const handleClose = () => {
    setTitle('');
    setRange({});
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex text-2xl items-center gap-2">Create New Dashboard</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Dashboard Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Dashboard Title</Label>
            <Input
              id="title"
              placeholder="Enter dashboard title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Month-Year Range Picker */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-12 !bg-white transition-all duration-200',
                    !range.start && !range.end && 'text-gray-500 border-input',
                    (range.start || range.end) && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <Calendar className="mr-3 h-5 w-5 text-primary" />
                  <span className="text-base">{formatRange()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-xl border-2 border-gray-200" align="start">
                <div className="p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewYear(viewYear - 1)}
                      className="hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-bold text-lg text-gray-900">{viewYear}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewYear(viewYear + 1)}
                      className="hover:bg-gray-100"
                    >
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

                  {(range.start || range.end) && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        {range.start && range.end ? 'Range selected' : 'Select end date'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRange}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date range preview */}
            {range.start && range.end && (
              <div className="text-sm text-muted-foreground">
                Duration: {Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent"
              disabled={createDashboardMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 text-white" disabled={createDashboardMutation.isPending}>
              {createDashboardMutation.isPending ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
