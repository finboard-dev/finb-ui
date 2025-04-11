"use client";
import React, { useEffect, useState, useRef } from "react";
import VegaLiteChart from "./Chart";
import ResizeObserver from "resize-observer-polyfill";

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

  return (
    <div ref={dashboardRef} className={` ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading visualizations...</div>
        </div>
      ) : (
        <div className="charts-grid w-full h-full flex flex-col">
          <div className="relative flex-1 w-full">
            <VegaLiteChart spec={charts} className="chart" />
          </div>
        </div>
      )}
    </div>
  );
}
