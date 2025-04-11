"use client";

import React, { useState, useEffect, useRef } from "react";
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
import VisualizationView from "../visualization/VisualizationView";
import { enhancedChartSpecs } from "@/data/dummyData";
import ResizeObserver from "resize-observer-polyfill";

const ResponsePanel = () => {
  // State to detect panel resize for triggering chart re-renders
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("visualization");
  const dispatch = useAppDispatch();
  const { sql, tableData } = useAppSelector((state) => state.responsePanel);

  // Track panel dimensions using ResizeObserver
  useEffect(() => {
    if (!panelRef.current) return;

    const updateDimensions = () => {
      if (panelRef.current) {
        const { width, height } = panelRef.current.getBoundingClientRect();
        setPanelSize({ width, height });
      }
    };

    // Set initial dimensions
    updateDimensions();

    // Create a ResizeObserver to detect panel size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(panelRef.current);

    return () => {
      if (panelRef.current) {
        resizeObserver.unobserve(panelRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Choose which chart to display based on panel size
  const getAppropriateChartSpec = () => {
    // For demonstration, we're using the pie chart (index 3)
    // We'll make a copy to avoid modifying the original
    return JSON.parse(JSON.stringify(enhancedChartSpecs[0]));
  };

  const handleSave = () => {
    dispatch(saveToLocalStorage());
    toast.success("All tabs saved to local storage");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setSqlQuery(value));
    }
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full bg-white"
      key={`panel-${panelSize.width}-${panelSize.height}`}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <TabsList className="bg-transparent h-auto border-gray-500 rounded-md">
            <TabsTrigger
              value="sql"
              className="px-3 py-2 data-[state=active]:bg-gray-100"
              title="SQL Editor"
              aria-label="SQL Editor"
            >
              <Code className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="visualization"
              className="px-3 py-2 data-[state=active]:bg-gray-100"
              title="Visualization"
              aria-label="Visualization"
            >
              <BarChart2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="px-3 py-2 data-[state=active]:bg-gray-100"
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
            className="hover:cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Save
          </Button>
        </div>

        <TabsContent
          value="sql"
          className="flex-1 p-4 overflow-auto bg-gray-50 rounded-md m-4"
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

        <TabsContent value="visualization" className="flex-1 p-4 flex flex-col">
          <div className="w-full h-full">
            <VisualizationView
              charts={getAppropriateChartSpec()}
              title="Business Analytics Overview"
            />
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
