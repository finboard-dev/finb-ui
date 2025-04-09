"use client";

import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Code, BarChart2, Table } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import {
  setSqlQuery,
  saveToLocalStorage,
} from "@/lib/store/slices/responsePanelSlice";
import GoogleSheet from "./GoogleSheetsEmbeded";
import { Preview } from "@/hooks/useBabelRenderer";
import HomeChart from "../visualization/Page";

const ResponsePanel = () => {
  const [chartCode, setChartCode] = useState(`
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  `);
  const [chartData, setChartData] = useState([
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 600 },
    { name: "Apr", value: 800 },
  ]);
  const [activeTab, setActiveTab] = useState("sql");
  const dispatch = useAppDispatch();
  const { sql, tableData } = useAppSelector((state) => {
    console.log("Redux state:", state.responsePanel);
    return state.responsePanel;
  });

  const handleSave = () => {
    dispatch(saveToLocalStorage());
    toast.success("All tabs saved to local storage");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setSqlQuery(value));
    }
  };

  const mockData = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 600 },
    { name: "Apr", value: 800 },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <TabsList className="bg-transparent h-auto border rounded-md">
            <TabsTrigger
              value="sql"
              className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
              title="SQL Editor"
              aria-label="SQL Editor"
            >
              <Code className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="visualization"
              className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
              title="Visualization"
              aria-label="Visualization"
            >
              <BarChart2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="px-3 py-2 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-zinc-800"
              title="Table"
              aria-label="Table"
            >
              <Table className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            className="hover:cursor-pointer"
          >
            Save
          </Button>
        </div>

        <TabsContent
          value="sql"
          className="flex-1 p-4 overflow-auto bg-gray-50 dark:bg-zinc-800 rounded-md m-4"
        >
          {sql === undefined ? (
            <p className="text-gray-500">No SQL query available</p>
          ) : (
            <Editor
              height="100%"
              width="100%"
              language="sql"
              value={sql}
              onChange={handleEditorChange}
              options={{ minimap: { enabled: false } }}
            />
          )}
        </TabsContent>

        <TabsContent
          value="visualization"
          className="flex-1 p-4 flex justify-center"
        >
          <div className="w-full max-w-3xl h-96 p-4 bg-white dark:bg-zinc-800 rounded-lg">
            <HomeChart />
          </div>
        </TabsContent>

        <TabsContent value="table" className="flex-1 p-4 overflow-auto">
          {tableData ? (
            <div className="w-full h-full overflow-x-auto">
              <GoogleSheet sheetId="2PACX-1vRYKvFuTDizMFcFVsoB-KMgWxlNAkNl6UhOeMu4pqEqjtrfQ7k-I-gkTlGlZVaFjN9eBzbfCUJZQkTA" />
            </div>
          ) : (
            <p className="text-gray-500">No table data available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResponsePanel;
