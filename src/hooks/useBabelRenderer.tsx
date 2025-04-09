"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

// Import all Recharts components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface PreviewProps {
  stringifiedCode: string;
  chartData: any[];
}

export function Preview({ stringifiedCode, chartData }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);

  const refreshPreview = () => {
    renderChart();
  };

  // Instead of evaluating JSX directly, create a component factory that returns pre-defined components
  const createChartComponent = (type: string) => {
    switch (type.toLowerCase()) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                fill="#8884d8"
                stroke="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Parse configuration from stringifiedCode
  const parseChartConfig = (code: string) => {
    try {
      // Extract chart type from code
      let chartType = "line"; // default

      if (code.includes("LineChart")) chartType = "line";
      else if (code.includes("BarChart")) chartType = "bar";
      else if (code.includes("AreaChart")) chartType = "area";
      else if (code.includes("PieChart")) chartType = "pie";

      return { chartType };
    } catch (err) {
      console.error("Error parsing chart configuration:", err);
      return { chartType: "line" }; // Default to line chart
    }
  };

  const renderChart = () => {
    if (!previewRef.current) return;

    if (!rootRef.current) {
      rootRef.current = ReactDOM.createRoot(previewRef.current);
    }

    try {
      setError(null);

      // Parse configuration from code
      const { chartType } = parseChartConfig(stringifiedCode);

      // Create chart component
      const chartComponent = createChartComponent(chartType);

      // Render chart
      rootRef.current.render(
        <div className="w-full h-full p-4">{chartComponent}</div>
      );
    } catch (err) {
      console.error("Error rendering chart:", err);
      setError(err instanceof Error ? err.message : String(err));

      if (rootRef.current) {
        rootRef.current.render(
          <div className="p-4 text-red-500">
            <p className="font-bold">Error in chart preview:</p>
            <pre className="mt-2 text-sm overflow-auto">
              {err instanceof Error ? err.message : String(err)}
            </pre>
          </div>
        );
      }
    }
  };

  // Render chart whenever the code or data changes
  useEffect(() => {
    renderChart();
  }, [stringifiedCode, chartData]);

  return (
    <div className="h-full border overflow-hidden rounded flex flex-col">
      <div className="p-0 bg-white flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <button
            onClick={refreshPreview}
            className="h-7 w-7 p-0 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border"
          >
            <RefreshCw className="h-4 w-4 mx-auto" />
            <span className="sr-only">Refresh preview</span>
          </button>
        </div>

        <div className="preview-container p-4 h-full w-full shadow-none bg-white overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 border border-red-300 bg-red-50 text-red-700 rounded">
              <p className="font-semibold">Error:</p>
              <pre className="text-sm mt-1 whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          <div ref={previewRef} className="w-full h-full"></div>
        </div>
      </div>
    </div>
  );
}
