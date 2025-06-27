// RestrictedChart Component - REVISED
"use client";

import React, {
  useEffect,
  useRef,
  CSSProperties,
  useMemo,
  useState,
  useCallback, // Added useCallback for clarity
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
  AlertTriangleIcon,
  Loader2Icon,
  Info,
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

// --- Theme and Builders (UNCHANGED, assume they are correct and robust) ---
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
      if (Array.isArray(xAxis) && xAxis.length > 0) xAxis = xAxis[0];
      if (xAxis && Array.isArray(xAxis.data))
        return xAxis.data.map((item: any) => String(item));
    }
    return undefined;
  }
  private static extractYAxisLabel(input: any): string | undefined {
    if (typeof input.yAxisLabel === "string") return input.yAxisLabel;
    if (input.yAxis) {
      let yAxis = input.yAxis;
      if (Array.isArray(yAxis) && yAxis.length > 0) yAxis = yAxis[0];
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
        if (item === "") return 0;
        if (typeof item === "string") {
          const num = parseFloat(item);
          if (!isNaN(num)) return num;
        }
        if (typeof item === "number" && isFinite(item)) return item;
        if (typeof item === "object" && item !== null) {
          if (typeof item.value === "number" && isFinite(item.value)) {
            return { name: String(item.name || ""), value: item.value };
          }
          const num = parseFloat(String(item));
          if (!isNaN(num)) return num;
        }
        return 0;
      })
      .filter((item) => item !== null) as (
      | number
      | { name: string; value: number }
    )[];
  }
}

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
// --- End Theme and Builders ---

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

  // Validate and process input data (memoized)
  const processedData = useMemo(() => {
    try {
      setError(null);
      return SchemaValidator.validate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid chart data");
      return { series: [] };
    }
  }, [data]);

  // Effect for ECharts initialization and primary disposal
  useEffect(() => {
    // This effect runs only ONCE when the component mounts, and its cleanup runs ONCE when it unmounts.
    // It's crucial for the initial setup and final teardown of the ECharts instance.
    if (!chartRef.current) {
      console.warn(
        "chartRef.current is null on mount. ECharts initialization will be skipped."
      );
      return;
    }

    let currentInstance: echarts.ECharts | null = null;
    const domElement = chartRef.current; // Capture DOM element for closure

    // Function to initialize the chart
    const initializeChart = () => {
      if (domElement.offsetHeight > 0 && domElement.offsetWidth > 0) {
        try {
          currentInstance = echarts.init(domElement);
          chartInstance.current = currentInstance; // Store instance in ref
          setIsLoading(false);
          setError(null);

          // Set options immediately after successful initialization
          if (processedData.series.length > 0) {
            const builder = ChartBuilderFactory.create(processedData);
            currentInstance.setOption(builder.build(), true);
          } else {
            setError("No series data available to display chart.");
          }
        } catch (err) {
          console.error("ECharts initialization error:", err);
          setError(
            err instanceof Error ? err.message : "Failed to initialize chart"
          );
          setIsLoading(false);
        }
      } else {
        // If dimensions are zero, retry after a short delay
        console.warn(
          "Chart container has zero dimensions. Retrying ECharts initialization."
        );
        setIsLoading(true);
        const retryTimeout = setTimeout(initializeChart, 100); // Retry initialization
        return () => clearTimeout(retryTimeout); // Cleanup retry timeout
      }
    };

    // Attempt to initialize immediately
    initializeChart();

    // Cleanup function for this useEffect
    return () => {
      // This runs when the component UNMOUNTS or if the dependencies change (empty array, so only unmount).
      // This is the CRITICAL part for preventing "removeChild" error.
      // We directly dispose the ECharts instance without a setTimeout or extra checks,
      // because if this useEffect is cleaning up, React is unmounting the component.
      const instanceToDispose = chartInstance.current;
      if (instanceToDispose && !instanceToDispose.isDisposed()) {
        try {
          echarts.dispose(instanceToDispose);
          console.log("ECharts instance disposed successfully during unmount.");
        } catch (e) {
          console.error("Error disposing ECharts instance on unmount:", e);
        } finally {
          chartInstance.current = null; // Clear the ref
        }
      }
    };
  }, []); // Empty dependency array: runs only on mount and cleanup on unmount

  // Effect to update chart options when data changes (runs after initialization)
  useEffect(() => {
    // This effect handles updates to the chart's options whenever `processedData` changes.
    // It assumes `chartInstance.current` has already been initialized by the first useEffect.
    if (chartInstance.current && !chartInstance.current.isDisposed()) {
      if (processedData.series.length > 0) {
        try {
          const builder = ChartBuilderFactory.create(processedData);
          const option = builder.build();
          chartInstance.current.setOption(option, true);
          setError(null);
        } catch (err) {
          console.error("ECharts setOption error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to update chart options"
          );
        }
      } else {
        // If data becomes empty, clear the chart and show a message
        chartInstance.current.clear();
        setError("No series data available to display chart.");
      }
    } else if (!chartInstance.current) {
      // If chart not yet initialized, but processedData changes,
      // it means the data for initialization is updated.
      // The first effect will handle the initial render based on `processedData`.
      // This is primarily for updates AFTER initial render.
      setIsLoading(true); // Indicate loading if chart not ready
      setError(null);
    }
  }, [processedData]); // Depends on processedData to update chart options

  // Handle resizing using ResizeObserver
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    const currentChartInstance = chartInstance.current; // Capture instance for closure

    if (chartRef.current && currentChartInstance) {
      resizeObserver = new ResizeObserver(() => {
        // Ensure the instance is not disposed and its DOM is still in the document flow
        if (
          !currentChartInstance.isDisposed() &&
          currentChartInstance.getDom().offsetParent !== null
        ) {
          currentChartInstance.resize();
        }
      });
      resizeObserver.observe(chartRef.current);
    } else {
      // Fallback for non-standard environments, though ResizeObserver is preferred
      const handleWindowResize = () => {
        if (chartInstance.current && !chartInstance.current.isDisposed()) {
          chartInstance.current.resize();
        }
      };
      window.addEventListener("resize", handleWindowResize);
      return () => window.removeEventListener("resize", handleWindowResize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

  // Conditionally render header based on editing mode or title/data presence
  const renderHeader = () => {
    const displayTitle =
      processedData.title ||
      (processedData.series.length > 0 && processedData.series[0]?.name) ||
      "Untitled Chart";
    const showHeader =
      showDragHandle ||
      showMenu ||
      !!processedData.title ||
      processedData.series.length > 0;

    if (!showHeader) return null;

    return (
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 h-[45px]">
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
            title={displayTitle}
          >
            {displayTitle}
          </h3>
        </div>
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 ml-auto rgl-no-drag"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white shadow-xl border-slate-200 z-[100] rgl-no-drag"
            >
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3Icon className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <CopyIcon className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
              )}
              {(onEdit || onDuplicate) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-sm text-red-600 hover:!text-red-500 hover:!bg-red-50 focus:!bg-red-50 focus:!text-red-600 opt"
                >
                  <Trash2Icon className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col bg-white shadow-sm border border-slate-200 overflow-hidden",
        className,
        showDragHandle ? "rounded-none" : "rounded-lg"
      )}
      style={style}
    >
      {renderHeader()}
      <div
        ref={chartRef}
        className="flex-1 w-full"
        style={{ height: height || "100%" }}
      >
        {isLoading && !error && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <Loader2Icon className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <span className="text-sm">Loading chart...</span>
          </div>
        )}
        {error && !isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 bg-red-50 rounded-md border border-red-200">
            <AlertTriangleIcon className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">
              Error rendering chart.
            </span>
            {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
          </div>
        )}
        {!isLoading && !error && processedData.series.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <Info className="w-8 h-8 mb-2 text-slate-300" />
            <span className="text-sm">No chart data available.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictedChart;
