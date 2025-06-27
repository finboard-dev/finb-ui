"use client";

import React, {
  useEffect,
  useRef,
  CSSProperties,
  useMemo,
  useState,
} from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import {
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Register ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  CanvasRenderer,
]);

// Theme configuration
const THEME = {
  colors: {
    primary: ["#4A90E2", "#5BA0F2", "#6CB0FF", "#7DC0FF", "#8ED0FF"],
    secondary: ["#D4A574", "#E4B584", "#F4C594", "#FFD5A4", "#FFE5B4"],
    success: ["#7ED321", "#8EE331", "#9EF341", "#AEFF51", "#BEFF61"],
    danger: ["#D0021B", "#E0122B", "#F0223B", "#FF324B", "#FF425B"],
    neutral: [
      "#2C3E50",
      "#34495E",
      "#5D6D7E",
      "#85929E",
      "#BDC3C7",
      "#D5DBDB",
      "#ECF0F1",
    ],
    accent: ["#9013FE", "#A023FF", "#B033FF", "#C043FF", "#D053FF"],
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: { title: 16, subtitle: 12, label: 11, value: 12, legend: 11 },
    weights: { title: 600, subtitle: 400, label: 400, value: 500, legend: 400 },
  },
  spacing: {
    card: { padding: 20, margin: 8, borderRadius: 12 },
    chart: { top: 60, bottom: 65, left: 20, right: 20 },
    title: { marginBottom: 15 },
  },
  dimensions: {
    cardHeight: 320,
    barMaxWidth: 32,
    pieRadius: ["40%", "68%"],
  },
} as const;

// Interfaces for allowed input
interface AllowedSeries {
  name?: string;
  type: "bar" | "line" | "pie" | "scatter" | "radar" | "area";
  data: (number | { name: string; value: number })[];
  stack?: string;
  itemStyle?: any;
}

interface AllowedInput {
  title?: string;
  subtitle?: string;
  xAxisData?: string[];
  yAxisLabel?: string;
  series: AllowedSeries[];
}

// Schema Validator
class SchemaValidator {
  static validate(input: any): AllowedInput {
    if (!input || typeof input !== "object") {
      return { series: [] };
    }

    return {
      title: this.extractTitle(input),
      subtitle: this.extractSubtitle(input),
      xAxisData: this.extractXAxisData(input),
      yAxisLabel: this.extractYAxisLabel(input),
      series: this.extractSeries(input),
    };
  }

  private static extractTitle(input: any): string | undefined {
    if (typeof input.title === "string") return input.title;
    if (input.title?.text && typeof input.title.text === "string")
      return input.title.text;
    return undefined;
  }

  private static extractSubtitle(input: any): string | undefined {
    if (input.title?.subtext && typeof input.title.subtext === "string")
      return input.title.subtext;
    if (typeof input.subtitle === "string") return input.subtitle;
    return undefined;
  }

  private static extractXAxisData(input: any): string[] | undefined {
    if (Array.isArray(input.xAxisData)) {
      return input.xAxisData.map((item: any) => String(item));
    }
    if (input.xAxis) {
      let xAxis = input.xAxis;
      if (Array.isArray(xAxis) && xAxis.length > 0) {
        xAxis = xAxis[0];
      }
      if (xAxis && Array.isArray(xAxis.data)) {
        return xAxis.data.map((item: any) => String(item));
      }
    }
    return undefined;
  }

  private static extractYAxisLabel(input: any): string | undefined {
    if (typeof input.yAxisLabel === "string") return input.yAxisLabel;
    if (input.yAxis) {
      let yAxis = input.yAxis;
      if (Array.isArray(yAxis) && yAxis.length > 0) {
        yAxis = yAxis[0];
      }
      if (yAxis && typeof yAxis.name === "string") return yAxis.name;
    }
    return undefined;
  }

  private static extractSeries(input: any): AllowedSeries[] {
    if (!input.series) return [];

    const seriesArray = Array.isArray(input.series)
      ? input.series
      : [input.series];
    return seriesArray
      .map((series: any) => this.validateSeries(series))
      .filter((series: null) => series !== null) as AllowedSeries[];
  }

  private static validateSeries(series: any): AllowedSeries | null {
    if (!series || typeof series !== "object") return null;

    const validTypes = ["bar", "line", "pie", "scatter", "radar", "area"];
    const type = validTypes.includes(series.type) ? series.type : "bar";

    const data = this.extractSeriesData(series.data || []);
    if (data.length === 0) return null;

    return {
      name: typeof series.name === "string" ? series.name : "Series",
      type: type as AllowedSeries["type"],
      data,
      stack: typeof series.stack === "string" ? series.stack : undefined,
      itemStyle: this.extractItemStyle(series.itemStyle),
    };
  }

  private static extractItemStyle(itemStyle: any): any {
    if (!itemStyle || typeof itemStyle !== "object") return undefined;
    return {
      color: typeof itemStyle.color === "string" ? itemStyle.color : undefined,
      ...itemStyle,
    };
  }

  private static extractSeriesData(
    data: any[]
  ): (number | { name: string; value: number })[] {
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        // Handle empty strings
        if (item === "") return 0;

        // Handle string numbers
        if (typeof item === "string") {
          const num = parseFloat(item);
          if (!isNaN(num)) return num;
        }

        // Handle numbers
        if (typeof item === "number" && isFinite(item)) return item;

        // Handle objects
        if (typeof item === "object" && item !== null) {
          if (typeof item.value === "number" && isFinite(item.value)) {
            return {
              name: String(item.name || ""),
              value: item.value,
            };
          }
          // Try to convert object to number if possible
          const num = parseFloat(String(item));
          if (!isNaN(num)) return num;
        }

        return 0; // Default to 0 for invalid values
      })
      .filter((item) => item !== null) as (
      | number
      | { name: string; value: number }
    )[];
  }
}

// Chart Type Detector
class ChartTypeDetector {
  static detect(
    series: AllowedSeries[]
  ): "bar" | "line" | "pie" | "scatter" | "radar" | "area" | "mixed" {
    if (series.length === 0) return "bar";

    const types = series.map((s) => s.type);
    const uniqueTypes = [...new Set(types)];

    return uniqueTypes.length > 1 ? "mixed" : uniqueTypes[0];
  }
}

abstract class BaseChartBuilder {
  protected input: any;
  protected themeColors: string[] = [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
  ];

  constructor(input: any) {
    this.input = input;
  }

  protected getAllColors(): string[] {
    return this.themeColors;
  }

  protected createBaseConfig(): any {
    return {
      color: this.getAllColors(),
      backgroundColor: "transparent",
      title: { show: false },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "white",
        borderWidth: 0,
        textStyle: { color: "black" },
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        left: "center",
        top: "top",
        data: this.input.series.map((s: any) => s.name || "Unnamed Series"),
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: "#333" },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "5%",
        containLabel: true,
      },
    };
  }

  protected createXAxis(): any {
    return {
      type: "category",
      data: this.input.xAxisData,
      axisLine: { lineStyle: { color: "#999" } },
      axisTick: { alignWithLabel: true },
      axisLabel: {
        rotate: this.shouldRotateLabels() ? 45 : 0,
        color: "#666",
      },
    };
  }

  protected createYAxis(): any {
    return {
      type: "value",
      name: this.input.yAxisLabel || "",
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: { color: "#666" },
      splitLine: { lineStyle: { color: "#e8e8e8" } },
    };
  }

  protected shouldRotateLabels(): boolean {
    return this.input.xAxisData.length > 8;
  }

  protected shouldAddDataZoom(): boolean {
    return this.input.xAxisData.length > 12;
  }

  protected addDataZoom(option: any): void {
    if (this.shouldAddDataZoom()) {
      option.dataZoom = [
        { type: "slider", start: 0, end: 100 },
        { type: "inside", start: 0, end: 100 },
      ];
    }
  }

  abstract build(): any;
}

class BarChartBuilder extends BaseChartBuilder {
  build(): any {
    const option = this.createBaseConfig();
    option.xAxis = this.createXAxis();
    option.yAxis = this.createYAxis();
    option.series = this.input.series.map((s: any) => ({
      name: s.name,
      type: "bar",
      data: s.data,
      stack: s.stack || null,
      barMaxWidth: 40,
      barGap: "30%",
    }));
    this.addDataZoom(option);
    return option;
  }
}

class LineChartBuilder extends BaseChartBuilder {
  build(): any {
    const option = this.createBaseConfig();
    option.xAxis = this.createXAxis();
    option.yAxis = this.createYAxis();
    option.series = this.input.series.map((s: any) => ({
      name: s.name,
      type: "line",
      data: s.data,
      smooth: true,
      lineStyle: { width: 2 },
    }));
    this.addDataZoom(option);
    return option;
  }
}

class PieChartBuilder extends BaseChartBuilder {
  build(): any {
    // Start with the base configuration
    const option = this.createBaseConfig();

    // Hide xAxis and yAxis for pie charts
    option.xAxis = { show: false };
    option.yAxis = { show: false };
    option.tooltip = { trigger: "item" };

    // Ensure series is an array; default to empty array if undefined or not an array
    const series = Array.isArray(this.input.series) ? this.input.series : [];

    // Map over series to create pie chart configuration
    option.series = series.map((s: any) => {
      // Ensure data is an array; default to empty array if undefined or not an array
      const data = Array.isArray(s.data) ? s.data : [];
      return {
        name: s.name || "Unnamed Series", // Default name if missing
        type: "pie",
        radius: "50%",
        center: ["50%", "50%"],
        data: data,
      };
    });

    return option;
  }
}

class AreaChartBuilder extends BaseChartBuilder {
  build(): any {
    const option = this.createBaseConfig();
    option.xAxis = this.createXAxis();
    option.yAxis = this.createYAxis();
    option.series = this.input.series.map((s: any) => ({
      name: s.name,
      type: "line",
      data: s.data,
      areaStyle: { opacity: 0.2 },
      smooth: true,
      lineStyle: { width: 2 },
    }));
    this.addDataZoom(option);
    return option;
  }
}

class MixedChartBuilder extends BaseChartBuilder {
  build(): any {
    const option = this.createBaseConfig();
    option.xAxis = this.createXAxis();
    option.yAxis = [
      this.createYAxis(),
      {
        type: "value",
        axisLine: { lineStyle: { color: "#999" } },
        axisLabel: { color: "#666" },
        splitLine: { show: false },
      },
    ];
    option.series = this.input.series.map((s: any, index: number) => {
      const baseSeries = {
        name: s.name,
        type: s.type,
        data: s.data,
        yAxisIndex: s.type === "bar" ? 0 : 1,
      };
      if (s.type === "bar") {
        return {
          ...baseSeries,
          stack: s.stack || null,
          barMaxWidth: 40,
          barGap: "30%",
        };
      } else if (s.type === "line") {
        return { ...baseSeries, smooth: true, lineStyle: { width: 2 } };
      }
      return baseSeries;
    });
    this.addDataZoom(option);
    return option;
  }
}

// Chart Builder Factory
class ChartBuilderFactory {
  static create(data: AllowedInput): BaseChartBuilder {
    const chartType = ChartTypeDetector.detect(data.series);

    switch (chartType) {
      case "bar":
        return new BarChartBuilder(data);
      case "line":
        return new LineChartBuilder(data);
      case "pie":
        return new PieChartBuilder(data);
      case "area":
        return new AreaChartBuilder(data);
      case "mixed":
        return new MixedChartBuilder(data);
      default:
        return new BarChartBuilder(data);
    }
  }
}

// RestrictedChart Component Props
export interface RestrictedChartProps {
  data: any;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  style?: CSSProperties;
  showDragHandle?: boolean;
  dragHandleProps?: React.HTMLProps<HTMLDivElement>;
  showMenu?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

// RestrictedChart Component
const RestrictedChart: React.FC<RestrictedChartProps> = ({
  data,
  title,
  subtitle,
  height,
  className = "",
  style = {},
  showDragHandle,
  dragHandleProps,
  showMenu = false,
  onDelete,
  onEdit,
  onDuplicate,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate and process input data
  const processedData = useMemo(() => {
    try {
      const validatedData = SchemaValidator.validate(data);
      if (title) validatedData.title = title;
      if (subtitle) validatedData.subtitle = subtitle;
      return validatedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid chart data");
      return { series: [] };
    }
  }, [data, title, subtitle]);

  // Initialize chart and handle resize
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    try {
      chartInstance.current = echarts.init(chartRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize chart"
      );
      return;
    }

    const chart = chartInstance.current;
    const chartElement = chartRef.current;

    const resizeChart = () => {
      chart?.resize();
    };

    // Use ResizeObserver to handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(resizeChart);
    });
    resizeObserver.observe(chartElement);

    // Also handle window resize
    window.addEventListener("resize", resizeChart);

    // Initial resize
    resizeChart();

    return () => {
      window.removeEventListener("resize", resizeChart);
      resizeObserver.disconnect();
      chart?.dispose();
    };
  }, []);

  // Update chart when data changes
  useEffect(() => {
    if (!chartInstance.current || !processedData.series.length) return;

    try {
      const chartType = ChartTypeDetector.detect(processedData.series);
      const builder = ChartBuilderFactory.create(processedData);
      const option = builder.build();
      chartInstance.current.setOption(option, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update chart");
    }
  }, [processedData]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden",
        className
      )}
      style={style}
    >
      {(processedData.title || showDragHandle || showMenu) && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-slate-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showDragHandle && (
              <div
                {...dragHandleProps}
                className={cn(
                  "flex items-center text-slate-500 hover:text-slate-700 cursor-grab active:cursor-grabbing flex-shrink-0",
                  dragHandleProps?.className
                )}
              >
                <GripVerticalIcon className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold text-slate-800 truncate"
                title={processedData.title}
              >
                {processedData.title || "Untitled Chart"}
              </h3>
              {processedData.subtitle && (
                <p
                  className="text-xs text-slate-500 truncate"
                  title={processedData.subtitle}
                >
                  {processedData.subtitle}
                </p>
              )}
            </div>
          </div>

          {showMenu && (
            <div className="flex-shrink-0 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto"
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit3Icon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onClick={onDuplicate}>
                      <CopyIcon className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}
      <div
        ref={chartRef}
        className="flex-1 w-full h-full"
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default RestrictedChart;
