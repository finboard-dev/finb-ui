import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Code, BarChart2, Table } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  setCodeData,
  saveToLocalStorage,
} from "@/lib/store/slices/responsePanelSlice";
import GoogleSheet from "./GoogleSheetsEmbeded";
import VisualizationView from "../visualization/VisualizationView";
import { enhancedChartSpecs } from "@/data/dummyData";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const ResponsePanel = () => {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("visualization");
  const dispatch = useAppDispatch();
  const { code, tableData, visualizationData } = useAppSelector(
    (state) => state.responsePanel
  );

  console.log(visualizationData, "visualizationData");

  useEffect(() => {
    if (!panelRef.current || typeof ResizeObserver === "undefined") return;

    const updateDimensions = () => {
      if (panelRef.current) {
        const { width, height } = panelRef.current.getBoundingClientRect();
        setPanelSize({ width, height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(panelRef.current);

    return () => {
      if (panelRef.current) {
        resizeObserver.unobserve(panelRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  const getAppropriateChartSpec = () => {
    return JSON.parse(JSON.stringify(enhancedChartSpecs[6]));
  };

  const handleSave = () => {
    dispatch(saveToLocalStorage());
    toast.success("All tabs saved to local storage");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setCodeData(value));
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
          {typeof code !== "string" || code === "" ? (
            <p className="text-gray-500">No SQL query available</p>
          ) : (
            <Editor
              height="100%"
              width="100%"
              language="json"
              theme="vs-light"
              value={code}
              onChange={handleEditorChange}
              options={{ minimap: { enabled: false } }}
            />
          )}
        </TabsContent>

        <TabsContent value="visualization" className="flex-1 p-4 flex flex-col">
          <div className="w-full h-full">
            {visualizationData === null ? (
              <p className="text-gray-500">No visualization data available</p>
            ) : (
              <VisualizationView
                charts={getAppropriateChartSpec()}
                title="Business Analytics Overview"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="flex-1 p-4 overflow-auto">
          {tableData ? (
            <div className="w-full h-full overflow-x-auto">
              <GoogleSheet sheetId={tableData} />
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
