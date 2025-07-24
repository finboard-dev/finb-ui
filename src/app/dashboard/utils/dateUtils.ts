export const formatLastRefreshed = (lastRefreshedAt: string | null): string => {
  if (!lastRefreshedAt) return 'Never';
  
  const now = new Date();
  const refreshed = new Date(lastRefreshedAt);
  const diffInMinutes = Math.floor((now.getTime() - refreshed.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatToYYYYMMDD = (date: Date, isEndDate: boolean = false): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  let day = '01';

  if (isEndDate) {
    const lastDay = getLastDayOfMonth(date.getFullYear(), date.getMonth());
    day = String(lastDay).padStart(2, '0');
  }

  return `${year}-${month}-${day}`;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return end > start;
}; 