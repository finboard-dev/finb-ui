// pages/index.tsx
import { useState } from "react";
import { TopLevelSpec } from "vega-lite";
import { DataFrame } from "./types";
import VisualizationView from "./VisualizationView";

export default function HomeChart() {
  // Sample DataFrames
  const singleDataFrame: DataFrame = {
    name: "single",
    columns: ["category", "sales"],
    data: [
      ["A", 28],
      ["B", 55],
      ["C", 43],
    ],
  };

  const mixedDataFrame: DataFrame = {
    name: "mixed",
    columns: ["category", "sales", "profit", "units", "jadu", "chance"],
    data: [
      ["A", 28, 12, 150, 23, 67],
      ["B", 55, 18, 200, 56, 78],
      ["C", 43, 15, 180, 34, 59],
    ],
  };

  const dualAxisDataFrame: DataFrame = {
    name: "dual",
    columns: ["category", "sales", "profitMargin"],
    data: [
      ["A", 28, 0.42],
      ["B", 55, 0.33],
      ["C", 43, 0.35],
    ],
  };

  const trendDataFrame: DataFrame = {
    name: "trend",
    columns: ["date", "revenue"],
    data: [
      ["2023-01-01", 1000],
      ["2023-02-01", 1200],
    ],
  };

  // Single Bar Chart Spec
  const singleSpec: TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Single Bar Chart - Sales by Category",
    data: {
      values: singleDataFrame.data.map((row) => ({
        category: row[0],
        sales: row[1],
      })),
    },
    mark: "bar",
    encoding: {
      x: { field: "category", type: "ordinal", title: "Category" },
      y: { field: "sales", type: "quantitative", title: "Sales" },
      color: { value: "#1f77b4" },
    },
    width: "container",
    height: "container",
  };

  // Mixed Chart Spec (Bar, Line, Scatter)
  const mixedSpec: TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Mixed Chart - Sales, Profit, and Units by Category",
    data: {
      values: mixedDataFrame.data.map((row) => ({
        category: row[0],
        sales: row[1],
        profit: row[2],
        units: row[3],
      })),
    },
    layer: [
      {
        mark: "bar",
        encoding: {
          x: { field: "category", type: "ordinal", title: "Category" },
          y: { field: "sales", type: "quantitative", title: "Sales" },
          color: { value: "#1f77b4" },
        },
      },
      {
        mark: "line",
        encoding: {
          x: { field: "category", type: "ordinal" },
          y: { field: "profit", type: "quantitative", title: "Profit" },
          color: { value: "#ff7f0e" },
        },
      },
      {
        mark: { type: "point", filled: true },
        encoding: {
          x: { field: "category", type: "ordinal" },
          y: { field: "units", type: "quantitative", title: "Units Sold" },
          color: { value: "#2ca02c" },
          size: { value: 100 },
        },
      },
    ],
    width: "container",
    height: "container",
  };

  // Dual-Axis Chart Spec (Bar and Line)
  const dualAxisSpec: TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Dual-Axis Chart - Sales and Profit Margin by Category",
    data: {
      values: dualAxisDataFrame.data.map((row) => ({
        category: row[0],
        sales: row[1],
        profitMargin: row[2],
      })),
    },
    layer: [
      {
        mark: "bar",
        encoding: {
          x: { field: "category", type: "ordinal", title: "Category" },
          y: {
            field: "sales",
            type: "quantitative",
            title: "Sales",
            axis: { titleColor: "#1f77b4" },
          },
          color: { value: "#1f77b4" },
        },
      },
      {
        mark: "line",
        encoding: {
          x: { field: "category", type: "ordinal" },
          y: {
            field: "profitMargin",
            type: "quantitative",
            title: "Profit Margin",
            axis: { orient: "right", titleColor: "#ff7f0e" },
          },
          color: { value: "#ff7f0e" },
        },
      },
    ],
    resolve: { scale: { y: "independent" } },
    width: "container",
    height: "container",
  };

  // Trend Chart Spec (Big Number)
  const trendSpec: TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Trend Chart - Monthly Revenue",
    data: {
      values: trendDataFrame.data.map((row) => ({
        date: row[0],
        revenue: row[1],
      })),
    },
    mark: "line",
    encoding: {
      x: { field: "date", type: "temporal", title: "Date" },
      y: { field: "revenue", type: "quantitative", title: "Revenue" },
    },
    width: "container",
    height: "container",
  };

  const [isHidden, setIsHidden] = useState(false);

  return (
    <div className="min-h-screen p-4 gap-4 bg-white">
      {/* Single Bar Chart */}
      {/* <div className="h-96">
        <VisualizationView
          title="Sales by Category"
          chartType="bar"
          spec={singleSpec}
          tooManyDataPointsHidden={true}
          onHideTooManyDataPointsWarning={() => {}}
          loading={false}
          error={null}
          dataframe={singleDataFrame}
          onNewSQL={() => console.log("New SQL")}
          controlsHidden={false}
          isFullScreen={false}
          renderer="canvas"
          isHidden={isHidden}
          onToggleHidden={() => setIsHidden(!isHidden)}
          onExportToSVG={() => console.log("Export PNG")}
          isDashboard={false}
          isEditable={true}
        />
      </div> */}

      <div className="h-96">
        <h2 className="text-lg font-bold mb-2">
          Mixed Chart (Bar, Line, Scatter)
        </h2>
        <VisualizationView
          title="Sales, Profit, and Units by Category"
          chartType="pie" // Base type; spec defines mixed behavior
          spec={mixedSpec}
          tooManyDataPointsHidden={true}
          onHideTooManyDataPointsWarning={() => {}}
          loading={false}
          error={null}
          dataframe={mixedDataFrame}
          onNewSQL={() => console.log("New SQL")}
          controlsHidden={false}
          isFullScreen={false}
          renderer="canvas"
          isHidden={isHidden}
          onToggleHidden={() => setIsHidden(!isHidden)}
          onExportToSVG={() => console.log("Export PNG")}
          isDashboard={false}
          isEditable={true}
        />
      </div>

      {/* Dual-Axis Chart */}
      {/* <div className="h-96">
        <h2 className="text-lg font-bold mb-2">
          Dual-Axis Chart (Bar and Line)
        </h2>
        <VisualizationView
          title="Sales and Profit Margin by Category"
          chartType="bar" // Base type; spec defines dual-axis
          spec={dualAxisSpec}
          tooManyDataPointsHidden={true}
          onHideTooManyDataPointsWarning={() => {}}
          loading={false}
          error={null}
          dataframe={dualAxisDataFrame}
          onNewSQL={() => console.log("New SQL")}
          controlsHidden={false}
          isFullScreen={false}
          renderer="canvas"
          isHidden={isHidden}
          onToggleHidden={() => setIsHidden(!isHidden)}
          onExportToSVG={() => console.log("Export PNG")}
          isDashboard={false}
          isEditable={true}
        />
      </div> */}

      {/* Trend Chart */}
      <div className="h-96">
        <h2 className="text-lg font-bold mb-2">Trend Chart (Big Number)</h2>
        {/* <VisualizationView
          title="Monthly Revenue Trend"
          chartType="trend"
          spec={trendSpec}
          tooManyDataPointsHidden={true}
          onHideTooManyDataPointsWarning={() => {}}
          loading={false}
          error={null}
          dataframe={trendDataFrame}
          onNewSQL={() => console.log("New SQL")}
          controlsHidden={false}
          isFullScreen={false}
          renderer="svg"
          isHidden={isHidden}
          onToggleHidden={() => setIsHidden(!isHidden)}
          onExportToSVG={() => console.log("Export PNG")}
          isDashboard={false}
          isEditable={true}
          showTooltip={true}
        /> */}
      </div>
    </div>
  );
}
