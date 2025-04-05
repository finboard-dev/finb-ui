"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Copy, Code, BarChart2, Table } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react"; // Import Monaco Editor

const ResponsePanel = () => {
  const [activeTab, setActiveTab] = useState("sql");
  const { messages, selectedVariant } = useAppSelector((state) => state.chat);
  const [sqlQuery, setSqlQuery] = useState(`SELECT 
  product_category,
  COUNT(*) as total_sales,
  SUM(amount) as revenue,
  AVG(amount) as avg_sale
FROM sales
WHERE transaction_date >= '2023-01-01'
GROUP BY product_category
ORDER BY revenue DESC
LIMIT 10;`);
  // Sample SQL query

  // Sample data that would result from the SQL query
  const sampleData = [
    {
      product_category: "Electronics",
      total_sales: 1200,
      revenue: 89500,
      avg_sale: 74.58,
    },
    {
      product_category: "Clothing",
      total_sales: 950,
      revenue: 45600,
      avg_sale: 48.0,
    },
    {
      product_category: "Home Goods",
      total_sales: 820,
      revenue: 38900,
      avg_sale: 47.44,
    },
    {
      product_category: "Books",
      total_sales: 1500,
      revenue: 28500,
      avg_sale: 19.0,
    },
    {
      product_category: "Beauty",
      total_sales: 650,
      revenue: 26300,
      avg_sale: 40.46,
    },
    {
      product_category: "Sports",
      total_sales: 480,
      revenue: 24800,
      avg_sale: 51.67,
    },
    {
      product_category: "Toys",
      total_sales: 720,
      revenue: 21600,
      avg_sale: 30.0,
    },
    {
      product_category: "Furniture",
      total_sales: 230,
      revenue: 18400,
      avg_sale: 80.0,
    },
    {
      product_category: "Food",
      total_sales: 1700,
      revenue: 17000,
      avg_sale: 10.0,
    },
    {
      product_category: "Jewelry",
      total_sales: 180,
      revenue: 16200,
      avg_sale: 90.0,
    },
  ];

  const handleCopy = (content: any) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleDownload = (content: any, filename: any) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Downloaded as ${filename}`);
  };

  const handleEditorChange = (value: string | undefined) => {
    setSqlQuery(value || "");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center">
          <Tabs
            defaultValue="sql"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col w-full"
          >
            <TabsList className="bg-transparent h-auto border rounded-md">
              <TabsTrigger
                value="sql"
                className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
                title="SQL"
              >
                <Code className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="visualization"
                className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
                title="Visualization"
              >
                <BarChart2 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
                title="Table"
              >
                <Table className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="hover:cursor-pointer"
            variant="outline"
            onClick={() =>
              handleCopy(
                activeTab === "sql"
                  ? sqlQuery // Use the state variable sqlQuery
                  : JSON.stringify(sampleData, null, 2)
              )
            }
          >
            {/* <Copy className="w-4 h-4 mr-2" /> */}
            Save
          </Button>
          {/* <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleDownload(
                activeTab === "sql"
                  ? sqlQuery // Use the state variable sqlQuery
                  : JSON.stringify(sampleData, null, 2),
                activeTab === "sql" ? "query.sql" : "data.json"
              )
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button> */}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <Tabs
          defaultValue="sql"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsContent
            value="sql"
            className="flex-1 p-4 overflow-auto bg-gray-50 dark:bg-zinc-800 rounded-md m-4"
          >
            <Editor
              height="100%"
              width="100%"
              language="sql"
              theme="#fff"
              value={sqlQuery} // Use the state variable sqlQuery
              onChange={handleEditorChange} // Handle changes in the editor
            />
          </TabsContent>

          <TabsContent
            value="visualization"
            className="flex-1 p-4 flex items-center justify-center"
          >
            <div className="w-full max-w-3xl h-96 p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <h3 className="text-center text-lg font-medium mb-4">
                Product Category Revenue
              </h3>
              <svg
                viewBox="0 0 800 400"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* X and Y axis */}
                <line
                  x1="80"
                  y1="350"
                  x2="750"
                  y2="350"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="80"
                  y1="50"
                  x2="80"
                  y2="350"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                {/* Labels for X axis */}
                {sampleData.map((item, index) => (
                  <g
                    key={`xlabel-${index}`}
                    transform={`translate(${120 + index * 65}, 350)`}
                  >
                    <text
                      transform="rotate(45)"
                      textAnchor="start"
                      fontSize="12"
                      dy="1em"
                      fill="currentColor"
                      className="text-xs"
                    >
                      {item.product_category}
                    </text>
                  </g>
                ))}
                {/* Labels for Y axis */}
                {[0, 20000, 40000, 60000, 80000].map((value, i) => (
                  <g key={`ylabel-${i}`}>
                    <line
                      x1="78"
                      y1={350 - (i * 300) / 4}
                      x2="82"
                      y2={350 - (i * 300) / 4}
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                    <text
                      x="70"
                      y={350 - (i * 300) / 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="currentColor"
                      dominantBaseline="middle"
                    >
                      {value.toLocaleString()}
                    </text>
                  </g>
                ))}
                {/* Bars */}
                {sampleData.map((item, index) => (
                  <rect
                    key={`bar-${index}`}
                    x={120 + index * 65}
                    y={350 - (item.revenue * 300) / 90000}
                    width="40"
                    height={(item.revenue * 300) / 90000}
                    fill="rgba(124, 58, 237, 0.7)"
                    stroke="rgb(124, 58, 237)"
                    strokeWidth="1"
                    rx="4"
                  >
                    <title>{`${
                      item.product_category
                    }: $${item.revenue.toLocaleString()}`}</title>
                  </rect>
                ))}
                {/* Chart Title */}
                <text
                  x="400"
                  y="30"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="currentColor"
                >
                  Revenue by Product Category
                </text>
              </svg>
            </div>
          </TabsContent>

          <TabsContent value="table" className="flex-1 p-4 overflow-auto">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    {Object.keys(sampleData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {sampleData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                        >
                          {key.includes("revenue") || key.includes("avg_sale")
                            ? typeof value === "number"
                              ? `$${value.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : value
                            : typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResponsePanel;
