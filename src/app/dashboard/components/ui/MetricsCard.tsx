import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  formatValue?: (value: number | string) => string;
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  change,
  changeLabel,
  formatValue = (val) => val.toString(),
  className,
}: MetricsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const formattedValue = formatValue(value);
  const formattedChange = change ? Math.abs(change).toFixed(1) : null;

  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-white border border-slate-200 shadow-sm",
        className
      )}
    >
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900">
          {formattedValue}
        </span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center text-sm font-medium",
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
