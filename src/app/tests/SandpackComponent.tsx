"use client";

import { useEffect, useState } from "react";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

export default function ComponentPreviewerPage() {
  // Use client-side only rendering to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const componentCode = `
  import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, profit: 2400, margin: 24 },
  { name: 'Feb', revenue: 3000, profit: 1398, margin: 46.6 },
  { name: 'Mar', revenue: 9800, profit: 2000, margin: 20.4 },
  { name: 'Apr', revenue: 3908, profit: 2780, margin: 71.1 },
  { name: 'May', revenue: 4800, profit: 1890, margin: 39.4 },
  { name: 'Jun', revenue: 3800, profit: 2390, margin: 62.9 },
  { name: 'Jul', revenue: 4300, profit: 3490, margin: 81.2 },
];

export default function DualAxisChart() {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#8884d8" />
          <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#82ca9d" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margin"
            name="Profit Margin (%)"
            stroke="#ff7300"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}`;

  const files = {
    "/App.js": componentCode,
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <SandpackProvider
        template="react"
        theme="light"
        files={files}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          visibleFiles: [],
          activeFile: "/App.js",
        }}
        customSetup={{
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
            recharts: "^2.5.0",
          },
        }}
      >
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{
            height: "400px",
            width: "100%",
            border: "none",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        />
      </SandpackProvider>
    </div>
  );
}
