"use client";

import React, { useEffect, useRef, useState } from "react";
import { View, parse } from "vega";
import { compile } from "vega-lite";
import { Handler } from "vega-tooltip";
import ResizeObserver from "resize-observer-polyfill";
import { version as vegaVersion } from "vega";
import { version as vegaLiteVersion } from "vega-lite";

interface VegaLiteChartProps {
  spec: any;
  className?: string;
}

const VegaLiteChart: React.FC<VegaLiteChartProps> = ({
  spec,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  // Set up resize observer to track container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Initial size measurement
    setContainerDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    // Set up resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;

      const { width, height } = entries[0].contentRect;
      setContainerDimensions({ width, height });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []);

  // In your VegaLiteChart component, modify the useEffect that handles rendering:

  useEffect(() => {
    if (!containerRef.current || !spec || containerDimensions.width === 0)
      return;

    try {
      // Clean up previous view if it exists
      if (viewRef.current) {
        viewRef.current.finalize();
        viewRef.current = null;
      }

      // Create a deep copy of the spec to avoid modifying the original
      const specWithDimensions = JSON.parse(JSON.stringify(spec));

      // Calculate dimensions with some padding
      const containerWidth = containerDimensions.width;
      const containerHeight = containerDimensions.height || 300; // Fallback height

      // Set explicit width and height with padding
      specWithDimensions.width = containerWidth - 20; // 10px padding on each side
      specWithDimensions.height = containerHeight - 20; // 10px padding on each side

      // Ensure the chart has autosize to fit container
      specWithDimensions.autosize = {
        type: "fit",
        contains: "padding",
      };

      // Compile Vega-Lite to Vega
      const vegaSpec = compile(specWithDimensions).spec;
      console.log(specWithDimensions);

      // Parse the Vega specification
      const runtime = parse(vegaSpec);

      // Create a new view instance
      const view = new View(runtime)
        .logLevel(1)
        .renderer("svg")
        .initialize(containerRef.current);

      // Set up tooltip handler
      const tooltipHandler = new Handler({
        theme: "light",
        offsetX: 10,
        offsetY: 10,
      });
      view.tooltip(tooltipHandler.call);

      // Run the view
      view.runAsync().catch((err) => {
        console.error("Error rendering chart:", err);
      });

      // Ensure the SVG fits the container
      const svg = containerRef.current.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
        svg.style.display = "block";
        svg.style.overflow = "visible";
      }

      // Store the view reference for cleanup
      viewRef.current = view;
    } catch (error) {
      console.error("Error rendering Vega-Lite chart:", error);
    }
  }, [spec, containerDimensions]);

  useEffect(() => {
    console.log("Vega version:", vegaVersion);
    console.log("Vega-Lite version:", vegaLiteVersion);
    console.log("Original spec:", JSON.stringify(spec));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className}`}
      style={{ minHeight: "full", position: "relative" }}
    />
  );
};

export default VegaLiteChart;
