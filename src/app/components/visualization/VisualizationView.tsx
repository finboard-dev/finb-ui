"use client";

import React, { useRef } from "react";
import VegaLiteChart from "./Chart";

interface ChartSpec {
  title?: string;
  encoding?: any;
  [key: string]: any;
}

interface DashboardProps {
  charts: ChartSpec;
  isLoading?: boolean;
  title?: string;
  className?: string;
}

export default function VisualizationView({
  charts,
  isLoading = false,
  title = "Business Analytics Dashboard",
  className = "",
}: DashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const safeCharts = charts ? JSON.parse(JSON.stringify(charts)) : null;

  return (
    <div ref={dashboardRef} className={`${className} overflow-hidden`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading visualizations...</div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="w-full relative" style={{ height: "100%" }}>
            {safeCharts ? (
              <VegaLiteChart
                spec={safeCharts}
                className="chart w-full h-full"
              />
            ) : (
              <div className="text-red-500">
                No chart specification available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
