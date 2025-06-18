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

// Abstract Base Chart Builder
abstract class BaseChartBuilder {
  protected data: AllowedInput;
  protected chartType: string;

  constructor(data: AllowedInput, chartType: string) {
    this.data = data;
    this.chartType = chartType;
  }

  protected createBaseConfig(): EChartsOption {
    return {
      color: this.getAllColors(),
      backgroundColor: "transparent",
      title: { show: false },
      tooltip: this.createTooltip(),
      legend: this.createLegend(),
      grid: this.createGrid(),
    };
  }

  private getAllColors(): string[] {
    return [
      ...THEME.colors.primary,
      ...THEME.colors.secondary,
      ...THEME.colors.success,
      ...THEME.colors.danger,
      ...THEME.colors.accent,
    ];
  }

  protected createTooltip(): any {
    return {
      trigger: "axis",
      confine: true,
      axisPointer: {
        type: "cross",
        lineStyle: { color: THEME.colors.neutral[4], width: 1, type: "dashed" },
      },
      backgroundColor: "#ffffff",
      borderColor: THEME.colors.neutral[5],
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 15],
      textStyle: {
        color: THEME.colors.neutral[1],
        fontSize: THEME.font.sizes.value,
        fontFamily: THEME.font.family,
      },
      extraCssText: "box-shadow: 0 6px 24px rgba(0,0,0,0.1);",
    };
  }

  protected createLegend(): any {
    return {
      show: this.data.series.length > 1,
      bottom: 10,
      left: "center",
      itemWidth: 14,
      itemHeight: 10,
      itemGap: 25,
      textStyle: {
        color: THEME.colors.neutral[2],
        fontSize: THEME.font.sizes.legend,
        fontFamily: THEME.font.family,
      },
      type: "scroll",
      pageIconColor: THEME.colors.primary[0],
      pageIconInactiveColor: THEME.colors.neutral[3],
    };
  }

  protected createGrid(): any {
    return {
      containLabel: true,
      left: THEME.spacing.chart.left,
      right: THEME.spacing.chart.right,
      top: THEME.spacing.chart.top,
      bottom: THEME.spacing.chart.bottom,
    };
  }

  protected createXAxis(): any {
    return {
      type: "category",
      data: this.data.xAxisData || [],
      axisLine: {
        show: true,
        lineStyle: { color: THEME.colors.neutral[5], width: 1 },
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        lineStyle: { color: THEME.colors.neutral[5] },
      },
      axisLabel: {
        color: THEME.colors.neutral[3],
        fontSize: THEME.font.sizes.label,
        fontFamily: THEME.font.family,
        margin: 12,
        interval: "auto",
        hideOverlap: true,
        rotate: this.shouldRotateLabels() ? 30 : 0,
        formatter: (value: any) => {
          const str = String(value);
          return str.length > 18 ? str.substring(0, 15) + "..." : str;
        },
      },
      splitLine: { show: false },
    };
  }

  protected createYAxis(): any {
    return {
      type: "value",
      name: this.data.yAxisLabel,
      splitNumber: 5,
      axisLine: {
        show: true,
        lineStyle: { color: THEME.colors.neutral[5], width: 1 },
      },
      axisTick: { show: false },
      axisLabel: {
        color: THEME.colors.neutral[3],
        fontSize: THEME.font.sizes.label,
        fontFamily: THEME.font.family,
        margin: 12,
        formatter: this.formatValue,
      },
      splitLine: {
        show: true,
        lineStyle: { color: THEME.colors.neutral[6], type: "dashed", width: 1 },
      },
    };
  }

  private formatValue(value: any): string {
    if (typeof value === "number" && isFinite(value)) {
      if (Math.abs(value) >= 1e12) return (value / 1e12).toFixed(1) + "T";
      if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + "B";
      if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
      if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
      if (Math.abs(value) < 1 && Math.abs(value) > 0) return value.toFixed(2);
      return String(Math.round(value));
    }
    return String(value);
  }

  protected shouldRotateLabels(): boolean {
    return this.data.xAxisData ? this.data.xAxisData.length > 8 : false;
  }

  protected addDataZoom(config: EChartsOption): void {
    if (this.data.xAxisData && this.data.xAxisData.length > 12) {
      const endPercentage = Math.min(
        100,
        (12 / this.data.xAxisData.length) * 100
      );
      config.dataZoom = [
        {
          type: "slider",
          xAxisIndex: 0,
          filterMode: "filter",
          start: 0,
          end: endPercentage,
          height: 20,
          bottom: 35,
          handleStyle: { color: THEME.colors.primary[0] },
          borderColor: THEME.colors.neutral[5],
          textStyle: { color: THEME.colors.neutral[3], fontSize: 10 },
          showDetail: false,
        },
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "filter",
          start: 0,
          end: endPercentage,
        },
      ];

      (config.grid as any).bottom = 85;
      (config.legend as any).bottom = 10;
    }
  }

  abstract build(): EChartsOption;
}

// Area Chart Builder
class AreaChartBuilder extends BaseChartBuilder {
  build(): EChartsOption {
    const config = this.createBaseConfig();
    config.xAxis = this.createXAxis();
    config.yAxis = this.createYAxis();
    config.series = this.createAreaSeries();

    this.addDataZoom(config);
    return config;
  }

  private createAreaSeries(): any[] {
    return this.data.series.map((series) => ({
      name: series.name,
      type: "line",
      data: series.data,
      stack: series.stack,
      areaStyle: { opacity: 0.8 },
      smooth: true,
      lineStyle: {
        width: 2,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 4,
        shadowOffsetY: 1,
      },
      symbol: "circle",
      symbolSize: 4,
      showSymbol: Array.isArray(series.data) && series.data.length < 50,
      label: { show: false },
      emphasis: {
        focus: "series",
        lineStyle: { width: 3 },
        symbolSize: 6,
      },
    }));
  }
}

// Bar Chart Builder
class BarChartBuilder extends BaseChartBuilder {
  build(): EChartsOption {
    const config = this.createBaseConfig();
    config.xAxis = this.createXAxis();
    config.yAxis = this.createYAxis();
    config.series = this.createBarSeries();

    (config.tooltip as any).trigger = "axis";
    (config.tooltip as any).axisPointer.type = "shadow";

    this.addDataZoom(config);
    return config;
  }

  private createBarSeries(): any[] {
    return this.data.series.map((series) => ({
      name: series.name,
      type: "bar",
      data: series.data,
      stack: series.stack,
      barMaxWidth: THEME.dimensions.barMaxWidth,
      barGap: "20%",
      barCategoryGap: "40%",
      itemStyle: {
        borderRadius: 0,
        borderWidth: 0,
      },
      label: { show: false },
      emphasis: {
        focus: "series",
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0,0,0,0.2)",
        },
      },
    }));
  }
}

// Line Chart Builder
class LineChartBuilder extends BaseChartBuilder {
  build(): EChartsOption {
    const config = this.createBaseConfig();
    config.xAxis = this.createXAxis();
    config.yAxis = this.createYAxis();
    config.series = this.createLineSeries();

    this.addDataZoom(config);
    return config;
  }

  private createLineSeries(): any[] {
    return this.data.series.map((series) => ({
      name: series.name,
      type: "line",
      data: series.data,
      smooth: true,
      lineStyle: {
        width: 3,
        shadowColor: "rgba(0,0,0,0.15)",
        shadowBlur: 6,
        shadowOffsetY: 2,
      },
      symbol: "circle",
      symbolSize: 6,
      showSymbol: Array.isArray(series.data) && series.data.length < 50,
      label: { show: false },
      emphasis: {
        focus: "series",
        lineStyle: { width: 4 },
        symbolSize: 8,
      },
    }));
  }
}

// Pie Chart Builder
class PieChartBuilder extends BaseChartBuilder {
  build(): EChartsOption {
    const config = this.createBaseConfig();

    config.xAxis = { show: false };
    config.yAxis = { show: false };
    config.grid = { show: false, containLabel: false };

    (config.tooltip as any).trigger = "item";
    delete (config.tooltip as any).axisPointer;

    config.series = this.createPieSeries();
    return config;
  }

  private createPieSeries(): any[] {
    return this.data.series.map((series) => ({
      name: series.name,
      type: "pie",
      data: series.data,
      radius: THEME.dimensions.pieRadius,
      center: ["50%", "50%"],
      avoidLabelOverlap: false,
      minAngle: 5,
      itemStyle: {
        borderRadius: 6,
        borderColor: "#fff",
        borderWidth: 2,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 8,
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 8,
        itemStyle: {
          shadowBlur: 15,
          shadowColor: "rgba(0,0,0,0.25)",
        },
      },
    }));
  }
}

// Mixed Chart Builder
class MixedChartBuilder extends BaseChartBuilder {
  build(): EChartsOption {
    const config = this.createBaseConfig();
    config.xAxis = this.createXAxis();
    config.yAxis = this.createDualYAxis();
    config.series = this.createMixedSeries();

    (config.grid as any).right = 50;
    this.addDataZoom(config);
    return config;
  }

  private createDualYAxis(): any[] {
    const primaryAxis = this.createYAxis();
    const secondaryAxis = {
      ...primaryAxis,
      position: "right",
      splitLine: { show: false },
      axisLine: {
        show: true,
        lineStyle: { color: THEME.colors.neutral[5] },
      },
    };

    return [primaryAxis, secondaryAxis];
  }

  private createMixedSeries(): any[] {
    return this.data.series.map((series, index) => {
      const yAxisIndex = series.type === "line" ? 1 : 0;

      const baseSeries = {
        name: series.name,
        data: series.data,
        yAxisIndex,
      };

      if (series.type === "bar") {
        return {
          ...baseSeries,
          type: "bar",
          barMaxWidth: THEME.dimensions.barMaxWidth,
          itemStyle: { borderRadius: 0 },
        };
      } else if (series.type === "line") {
        return {
          ...baseSeries,
          type: "line",
          smooth: true,
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        };
      }

      return { ...baseSeries, type: series.type };
    });
  }
}

// Chart Builder Factory
class ChartBuilderFactory {
  static create(data: AllowedInput): BaseChartBuilder {
    const chartType = ChartTypeDetector.detect(data.series);

    switch (chartType) {
      case "bar":
        return new BarChartBuilder(data, chartType);
      case "line":
        return new LineChartBuilder(data, chartType);
      case "pie":
        return new PieChartBuilder(data, chartType);
      case "area":
        return new AreaChartBuilder(data, chartType);
      case "mixed":
        return new MixedChartBuilder(data, chartType);
      default:
        return new BarChartBuilder(data, chartType);
    }
  }
}

// RestrictedChart Component Props
export interface RestrictedChartProps {
  data: any;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate and process input data
  const processedData = useMemo(() => {
    try {
      return SchemaValidator.validate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid chart data");
      return { series: [] };
    }
  }, [data]);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      // Initialize chart
      chartInstance.current = echarts.init(chartRef.current);
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize chart"
      );
      setIsLoading(false);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
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

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      {(showDragHandle || showMenu) && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          {showDragHandle && (
            <div
              {...dragHandleProps}
              className={cn(
                "flex items-center text-slate-500 hover:text-slate-700 cursor-grab active:cursor-grabbing",
                dragHandleProps?.className
              )}
            >
              <GripVerticalIcon className="w-4 h-4" />
            </div>
          )}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
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
          )}
        </div>
      )}
      <div
        ref={chartRef}
        className="flex-1 w-full"
        style={{ height: height || "100%" }}
      />
    </div>
  );
};

export default RestrictedChart;
