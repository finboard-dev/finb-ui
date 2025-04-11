"use client";

import React, { useEffect, useRef, useState } from "react";
import { View, parse } from "vega";
import { compile } from "vega-lite";
import { Handler } from "vega-tooltip";
import ResizeObserver from "resize-observer-polyfill"; // For better browser support

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

  // Handle chart rendering when spec or container size changes
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

      // Always use container width as the chart width
      specWithDimensions.width = containerDimensions.width - 20; // Small padding

      // For height, either use the container height or maintain aspect ratio
      specWithDimensions.height = Math.min(
        containerDimensions.height - 20, // Avoid overflow
        containerDimensions.width * 0.6 // Maintain reasonable aspect ratio
      );

      // Handle axis configuration to prevent overlapping labels
      if (
        specWithDimensions.encoding &&
        specWithDimensions.encoding.x &&
        specWithDimensions.encoding.x.axis
      ) {
        // Adjust x-axis label angle based on container width
        if (containerDimensions.width < 500) {
          specWithDimensions.encoding.x.axis.labelAngle = -45;
          specWithDimensions.encoding.x.axis.labelAlign = "right";
          specWithDimensions.encoding.x.axis.labelBaseline = "middle";
        } else {
          // Reset to horizontal labels for wider containers
          specWithDimensions.encoding.x.axis.labelAngle = 0;
          specWithDimensions.encoding.x.axis.labelAlign = "center";
          specWithDimensions.encoding.x.axis.labelBaseline = "top";
        }
      }

      // Adjust legend position and layout based on container width
      if (
        specWithDimensions.encoding &&
        specWithDimensions.encoding.color &&
        specWithDimensions.encoding.color.legend
      ) {
        if (containerDimensions.width < 500) {
          specWithDimensions.encoding.color.legend.orient = "bottom";
          specWithDimensions.encoding.color.legend.columns = 2;
        } else {
          specWithDimensions.encoding.color.legend.orient = "right";
          specWithDimensions.encoding.color.legend.columns = 1;
        }
      }

      // Compile Vega-Lite to Vega
      const vegaSpec = compile(specWithDimensions).spec;

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

      // Make sure the SVG scales to fit the container
      view.run();

      // Ensure the SVG fits the container
      const svg = containerRef.current.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.display = "block";
      }

      // Store the view reference for cleanup
      viewRef.current = view;
    } catch (error) {
      console.error("Error rendering Vega-Lite chart:", error);
    }
  }, [spec, containerDimensions]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
};

export default VegaLiteChart;
