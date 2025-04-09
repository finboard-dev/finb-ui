// visualizations/VisualizationView.tsx
import defaultTheme from "tailwindcss/defaultTheme";
const twFontFamiliy = defaultTheme.fontFamily;
import { timeFormat } from "d3-time-format";
import { format as d3Format } from "d3-format";
import {
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/solid";
import { Vega } from "react-vega";
import { TopLevelSpec } from "vega-lite";
import {
  ArrowLongDownIcon,
  ArrowLongUpIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { CubeTransparentIcon } from "@heroicons/react/24/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import useResettableState from "./useResettableState";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { ChartType, DataFrame } from "./types";
import LargeSpinner from "./LargeSpinner";
import { findMaxFontSize, measureText } from "./measureText";

const FONT_FAMILY = ["Inter", ...twFontFamiliy.sans].join(", ");

interface Props {
  title: string;
  chartType: ChartType;
  spec: TopLevelSpec | null;
  tooManyDataPointsHidden: boolean;
  onHideTooManyDataPointsWarning: () => void;
  loading: boolean;
  error: "dataframe-not-found" | "unknown" | "invalid-params" | null;
  dataframe: DataFrame | null;
  onNewSQL: () => void;
  controlsHidden: boolean;
  isFullScreen: boolean;
  renderer?: "canvas" | "svg";
  isHidden: boolean;
  onToggleHidden: () => void;
  onExportToSVG?: () => void;
  isDashboard: boolean;
  isEditable: boolean;
  showTooltip?: boolean; // New prop for tooltip
}

function VisualizationView(props: Props) {
  const key = `${props.controlsHidden.toString()}${props.isFullScreen.toString()}`;

  return (
    <div
      key={key}
      className={clsx(
        !props.controlsHidden && !props.isDashboard && "w-2/3",
        "flex-grow h-full flex items-center justify-center relative"
      )}
    >
      {props.spec ? (
        <div className="relative w-full h-full">
          <BrieferVega
            title={props.title}
            spec={props.spec}
            renderer="svg"
            chartType={props.chartType}
            isDashboard={props.isDashboard}
            showTooltip={props.showTooltip ?? true} // Default to true if not specified
          />
          {props.loading && (
            <div className="absolute top-0 left-0 h-full w-full flex flex-col items-center justify-center bg-ceramic-50/60 backdrop-blur-sm">
              <LargeSpinner color="#6366f1" />
            </div>
          )}
          {!props.tooManyDataPointsHidden && !props.isDashboard && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-50 p-3 rounded-t-md border-b border-yellow-200">
              <div className="flex items-center justify-center gap-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm leading-5 text-yellow-700">
                  Too many data points. Consider filtering or aggregating the
                  data.
                </span>
                <button
                  className="absolute right-2.5 hover:bg-yellow-100 rounded-full p-1 transition-colors"
                  onClick={props.onHideTooManyDataPointsWarning}
                >
                  <XMarkIcon className="h-4 w-4 text-yellow-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : props.loading ? (
        <div className="absolute top-0 left-0 h-full w-full flex flex-col items-center justify-center bg-ceramic-50/60 backdrop-blur-sm">
          <LargeSpinner color="#6366f1" />
        </div>
      ) : (
        <div className="flex flex-col h-full w-full space-y-6 items-center justify-center bg-gray-50 rounded-md border border-gray-200">
          {props.error === "dataframe-not-found" && props.dataframe ? (
            <div className="flex flex-col items-center justify-center gap-y-2 p-6 bg-white rounded-lg shadow-sm">
              <ExclamationTriangleIcon className="h-12 w-12 text-amber-400" />
              <div className="flex flex-col items-center text-sm text-gray-600 gap-y-2">
                <div className="font-medium">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {props.dataframe.name}
                  </span>{" "}
                  not found.
                </div>
                <div>
                  Try running the block for{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {props.dataframe.name}
                  </span>{" "}
                  again.
                </div>
              </div>
            </div>
          ) : props.error === "unknown" ? (
            <div className="flex flex-col items-center justify-center gap-y-3 p-6 bg-white rounded-lg shadow-sm">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
              <span className="text-lg text-gray-700 font-medium">
                Something went wrong
              </span>
              <span className="text-sm text-gray-500">
                Please try again or check your data source
              </span>
            </div>
          ) : props.error === "invalid-params" ? (
            <div className="flex flex-col items-center justify-center gap-y-3 p-6 bg-white rounded-lg shadow-sm">
              <ExclamationTriangleIcon className="h-12 w-12 text-orange-400" />
              <span className="text-lg text-gray-700 font-medium">
                Missing or invalid parameters
              </span>
              <span className="text-sm text-gray-500">
                Check your chart configuration
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-y-3 p-6 bg-white rounded-lg shadow-sm">
              <CubeTransparentIcon className="h-12 w-12 text-indigo-300" />
              <span className="text-lg text-gray-700 font-medium">
                No data to display
              </span>
              {!props.dataframe && (
                <button
                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 px-4 py-2 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
                  onClick={props.onNewSQL}
                >
                  Add a SQL block to fetch data
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {!props.isDashboard && props.isEditable && (
        <button
          className={clsx(
            "absolute bottom-0 bg-white rounded-tr-md border-t border-r border-gray-200 p-1.5 hover:bg-gray-50 z-10 transition-colors shadow-sm",
            props.isHidden ? "left-0 rounded-bl-md" : "-left-[1px]"
          )}
          onClick={props.onToggleHidden}
        >
          {props.isHidden ? (
            <ChevronDoubleRightIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDoubleLeftIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
      )}
      {!props.isDashboard &&
        props.chartType !== "number" &&
        props.chartType !== "trend" && (
          <button
            className="absolute bottom-0 bg-white rounded-tl-md rounded-br-md border-t border-l border-gray-200 p-1.5 hover:bg-gray-50 z-10 right-0 text-xs text-gray-500 font-medium transition-colors shadow-sm"
            onClick={props.onExportToSVG}
          >
            SVG
          </button>
        )}
    </div>
  );
}

function BrieferVega(props: {
  title: string;
  chartType: ChartType;
  isDashboard: boolean;
  spec: TopLevelSpec;
  renderer?: "canvas" | "svg";
  showTooltip?: boolean;
}) {
  const [size, setSize] = useResettableState<{
    width: number;
    height: number;
  } | null>(() => ({ width: 400, height: 300 }), [props.spec, props.renderer]);

  const measureDiv = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!size && measureDiv.current) {
      const { width, height } = measureDiv.current.getBoundingClientRect();
      setSize({ width, height });
    }
  }, [measureDiv.current, size, setSize]);

  useEffect(() => {
    if (!container.current) return;
    const parent = container.current.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(
      debounce(() => {
        const { width, height } = parent.getBoundingClientRect();

        if (width && height) {
          if (!size || size.width !== width || size.height !== height) {
            setSize({ width, height });
          }
        }
      }, 500)
    );

    observer.observe(parent);
    return () => observer.disconnect();
  }, [container.current, size, setSize]);

  const spec: TopLevelSpec = useMemo(() => {
    if (!size) return props.spec;

    const isLayeredSpec = "layer" in props.spec;
    let config = props.spec.config || {};
    let layer = isLayeredSpec ? (props.spec as any).layer : undefined;

    // Add tooltip configuration if showTooltip is true
    if (props.showTooltip) {
      config = {
        ...config,
        mark: {
          ...config.mark,
          tooltip: true,
        },
      };
    }

    // Add modern styling to the chart
    config = {
      ...config,
      background: "transparent",
      arc: { ...config.arc, fill: "#6366f1" },
      area: { ...config.area, fill: "#818cf8", fillOpacity: 0.6 },
      bar: {
        ...config.bar,
        fill: "#6366f1",
        cornerRadiusTopLeft: 4,
        cornerRadiusTopRight: 4,
      },
      line: { ...config.line, stroke: "#6366f1", strokeWidth: 2 },
      // Removed invalid 'path' property
      rect: { ...config.rect, fill: "#6366f1" },
      // Removed invalid 'shape' property
      point: { ...config.point, fill: "#6366f1", size: 80 },
      axis: {
        ...config.axis,
        labelFont: FONT_FAMILY,
        labelFontSize: 11,
        titleFont: FONT_FAMILY,
        titleFontSize: 12,
        titleFontWeight: 500,
        labelColor: "#6b7280",
        titleColor: "#4b5563",
        domainColor: "#e5e7eb",
        gridColor: "#f3f4f6",
        tickColor: "#e5e7eb",
      },
      legend: {
        ...config.legend,
        labelFont: FONT_FAMILY,
        labelFontSize: 11,
        titleFont: FONT_FAMILY,
        titleFontSize: 12,
        titleFontWeight: 500,
        labelColor: "#6b7280",
        titleColor: "#4b5563",
      },
      title: {
        ...config.title,
        font: FONT_FAMILY,
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
      },
    };

    if (size.width < 300) {
      try {
        config = {
          ...config,
          axis: { ...config.axis, labels: false },
        };

        if (isLayeredSpec && layer) {
          layer = layer.map((l: any) => ({
            ...l,
            encoding: {
              ...l.encoding,
              color: l.encoding?.color
                ? { ...l.encoding.color, legend: null }
                : l.encoding?.color,
            },
          }));
        }
      } catch (err) {
        console.error("Config error:", err);
      }
    }

    return {
      ...props.spec,
      width: size.width,
      height: size.height,
      config,
      ...(isLayeredSpec && layer ? { layer } : {}),
    } as TopLevelSpec;
  }, [props.spec, size, props.showTooltip]);

  if (!size) return <div className="w-full h-full" ref={measureDiv} />;

  if (props.chartType === "trend" || props.chartType === "number") {
    return (
      <div ref={container} className="ph-no-capture h-full">
        <BigNumberVisualization
          chartType={props.chartType}
          title={props.title}
          spec={spec}
          size={size}
          isDashboard={props.isDashboard}
        />
      </div>
    );
  }

  return (
    <div ref={container} className="ph-no-capture h-full">
      <Vega
        className="rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        spec={spec}
        renderer="svg"
        actions={false}
        tooltip={props.showTooltip || false}
      />
    </div>
  );
}

function extractXYFromSpec(spec: TopLevelSpec): { x: any; y: any } {
  if ("layer" in spec) {
    let layer = spec.layer[0];
    while ("layer" in layer) layer = layer.layer[0];
    const encoding = layer.encoding || {};
    return {
      x: encoding.x || {},
      y: encoding.y || {},
    };
  } else if ("encoding" in spec) {
    const encoding = spec.encoding || {};
    return {
      x: encoding.x || {},
      y: encoding.y || {},
    };
  }
  return { x: {}, y: {} }; // Fallback for unsupported spec types
}

function BigNumberVisualization(props: {
  title: string;
  chartType: "trend" | "number";
  spec: TopLevelSpec;
  size: { width: number; height: number };
  isDashboard: boolean;
}) {
  const { spec, size } = props;
  const [isHovered, setIsHovered] = useState(false);

  try {
    // Safely extract dataset, handling different data formats
    let dataset: any[] = [];
    if (spec.data) {
      if ("name" in spec.data && spec.datasets && spec.data.name) {
        const namedDataset = spec.datasets[spec.data.name];
        dataset = Array.isArray(namedDataset) ? namedDataset : [];
      } else if ("values" in spec.data) {
        const values = spec.data.values;
        if (Array.isArray(values)) {
          dataset = values;
        } else if (typeof values === "string") {
          try {
            const parsedValues = JSON.parse(values);
            dataset = Array.isArray(parsedValues) ? parsedValues : [];
          } catch (parseError) {
            console.error("Failed to parse data values string:", parseError);
            dataset = [];
          }
        }
      }
    }

    if (dataset.length === 0) {
      throw new Error("Dataset is empty or not an array");
    }

    const { x, y } = extractXYFromSpec(spec);
    const latests = dataset.slice(-2);
    const latest = latests.pop();
    const prev = latests.pop();

    if (!x.field || !y.field || !latest) {
      throw new Error("Missing x or y encoding fields or data");
    }

    const lastValue = {
      x: latest[x.field],
      displayX: latest[x.field],
      y: latest[y.field],
      displayY: latest[y.field],
    };
    const prevValue = {
      x: prev?.[x.field] ?? 0,
      displayX: prev?.[x.field] ?? 0,
      y: prev?.[y.field] ?? 0,
      displayY: prev?.[y.field] ?? 0,
    };

    const yFormat = y.axis?.format;
    if (yFormat) {
      lastValue.displayY = d3Format(yFormat)(lastValue.y);
      prevValue.displayY = d3Format(yFormat)(prevValue.y);
    }

    const xFormat = x.axis?.format;
    if (xFormat) {
      lastValue.displayX = d3Format(xFormat)(lastValue.x);
      prevValue.displayX = d3Format(xFormat)(prevValue.x);
    } else {
      const xType = x.type;
      switch (xType) {
        case "temporal": {
          const timeUnit = x.timeUnit;
          if (!timeUnit) {
            lastValue.displayX = new Date(lastValue.x).toLocaleDateString();
            prevValue.displayX = new Date(prevValue.x).toLocaleDateString();
          } else {
            const timeFormats: Record<string, string> = {
              year: "%b %d, %Y %I:00 %p",
              yearmonth: "%b %d, %Y %I:00 %p",
              yearquarter: "%b %d, %Y %I:00 %p",
              yearweek: "%b %d, %Y %I:00 %p",
              yearmonthdate: "%b %d, %Y %I:00 %p",
              yearmonthdatehours: "%b %d, %Y %I:00 %p",
              yearmonthdatehoursminutes: "%b %d, %Y %I:%M %p",
              yearmonthdatehoursminutesseconds: "%b %d, %Y %I:%M:%S %p",
            };
            const format = timeFormats[timeUnit as string];
            if (format) {
              const formatter = timeFormat(format);
              lastValue.displayX = formatter(new Date(lastValue.x));
              prevValue.displayX = formatter(new Date(prevValue.x));
            }
          }
          break;
        }
        case "quantitative":
          lastValue.displayX = d3Format(".2f")(lastValue.x);
          prevValue.displayX = d3Format(".2f")(prevValue.x);
          break;
        case "ordinal":
          lastValue.displayX = lastValue.x;
          prevValue.displayX = prevValue.x;
          break;
      }
    }

    const minDimension = Math.min(size.width, size.height);
    const fontSize = Math.min(
      Math.max(
        8,
        Math.min(
          findMaxFontSize(
            lastValue.displayY as string,
            minDimension / 3,
            size.width - 32,
            "bold",
            FONT_FAMILY
          ),
          100
        )
      )
    );

    const lastXValueFontSize = Math.max(fontSize / 4, 12);
    const prevYValueFontSize = Math.max(lastXValueFontSize * 0.9, 10);

    let trend = lastValue.y === prevValue.y ? 0 : lastValue.y / prevValue.y - 1;
    if (prevValue.y !== lastValue.y) {
      if (prevValue.y === 0) trend = Infinity;
      else if (lastValue.y === 0) trend = -1;
    }

    let trendDisplay = d3Format(".2%")(Math.abs(trend));
    if (trend === 0) trendDisplay = "No change";
    else if (trend === Infinity) trendDisplay = "∞%";

    const lastXValueFits = minDimension > 200;
    const trendWidth =
      measureText(`↑ ${trendDisplay}`, prevYValueFontSize, "500", FONT_FAMILY)
        .width + 4;
    const prevXValueWidth = measureText(
      `• vs. ${prevValue.displayX}`,
      prevYValueFontSize,
      "500",
      FONT_FAMILY
    ).width;
    const prevYValueWidth = measureText(
      `: ${prevValue.displayY}`,
      (fontSize / 4) * 0.9,
      "500",
      FONT_FAMILY
    ).width;

    const prevYValueFits =
      size.width - 32 > prevYValueWidth + prevXValueWidth + trendWidth;
    const prevXValueFits = size.width - 32 > prevXValueWidth + trendWidth;
    const arrowSize =
      !prevXValueFits && !lastXValueFits
        ? Math.min(prevYValueFontSize * 1.8, size.height - fontSize * 1.3 - 32)
        : prevYValueFontSize;

    return (
      <div
        className="flex flex-col h-full py-4 px-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col justify-center items-center text-center h-full overflow-hidden relative">
          {props.title && (
            <h2 className="text-gray-500 text-sm mb-2 font-medium">
              {props.title}
            </h2>
          )}
          <h1
            className="font-bold text-indigo-700"
            style={{ fontSize, lineHeight: `${fontSize + 6}px` }}
          >
            {lastValue.displayY}
          </h1>
          {props.chartType === "trend" && (
            <>
              {lastXValueFits && (
                <h3
                  className="text-gray-600 font-medium mt-1"
                  style={{ fontSize: lastXValueFontSize }}
                >
                  {lastValue.displayX}
                </h3>
              )}
              <div
                className="flex justify-center font-medium text-nowrap mt-2"
                style={{ fontSize: prevYValueFontSize }}
              >
                <div
                  className={clsx(
                    {
                      "text-red-500": trend < 0,
                      "text-emerald-500": trend > 0,
                      "text-blue-400": trend === 0,
                    },
                    "flex items-center"
                  )}
                  style={{
                    fontSize:
                      !prevXValueFits && !lastXValueFits
                        ? Math.min(
                            prevYValueFontSize * 1.8,
                            size.height - fontSize * 1.3 - 32
                          )
                        : prevYValueFontSize,
                  }}
                >
                  {trend === 0 ? null : trend < 0 ? (
                    <ArrowLongDownIcon
                      style={{ height: arrowSize, width: arrowSize }}
                    />
                  ) : (
                    <ArrowLongUpIcon
                      style={{ height: arrowSize, width: arrowSize }}
                    />
                  )}
                  <span>{trendDisplay}</span>
                </div>
                {prevXValueFits && (
                  <>
                    <span className="text-gray-400 px-1">•</span>
                    <h4 className="text-gray-500">
                      vs. {prevValue.displayX}
                      {prevYValueFits && (
                        <>
                          :{" "}
                          <span className="text-gray-400">
                            {prevValue.displayY}
                          </span>
                        </>
                      )}
                    </h4>
                  </>
                )}
              </div>
            </>
          )}
          {isHovered && dataset.length > 2 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-gray-50 py-1 text-xs text-gray-500 rounded-b-lg opacity-0 transition-opacity duration-300"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              {dataset.length} data points
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error("BigNumberVisualization error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 flex items-center justify-center h-full">
        <div className="max-w-xs">
          <p className="font-medium">Error rendering visualization</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      </div>
    );
  }
}

// Helper function to export the visualization as an SVG
export function exportAsSVG(vegaContainer: HTMLElement): string | null {
  try {
    // Find the SVG element inside the container
    const svgElement = vegaContainer.querySelector("svg");
    if (!svgElement) {
      console.error("No SVG element found in the container");
      return null;
    }

    // Create a clone of the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;

    // Set viewBox if it doesn't exist
    if (
      !svgClone.getAttribute("viewBox") &&
      svgClone.getAttribute("width") &&
      svgClone.getAttribute("height")
    ) {
      const width = svgClone.getAttribute("width")!;
      const height = svgClone.getAttribute("height")!;
      svgClone.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Add namespaces for proper SVG rendering
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Get the SVG as a string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);

    // Add XML declaration
    svgString =
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;

    return svgString;
  } catch (error) {
    console.error("Error exporting SVG:", error);
    return null;
  }
}

// Helper function to trigger download of SVG file
export function downloadSVG(
  svgString: string,
  filename: string = "visualization.svg"
): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export default VisualizationView;
