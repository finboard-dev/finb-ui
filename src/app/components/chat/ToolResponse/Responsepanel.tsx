"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  X,
  Code,
  BarChart2,
  Table,
  RefreshCw,
  Eye,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  setCodeData,
  saveToLocalStorage,
  setActiveToolCallId,
  type ToolCallResponse,
} from "@/lib/store/slices/responsePanelSlice";
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice";
import VisualizationView from "../../visualization/VisualizationView";
import GoogleSheet from "./GoogleSheetsEmbeded";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ResponsePanelProps {
  activeMessageId?: string;
}

const ResponsePanel = ({ activeMessageId }: ResponsePanelProps) => {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<Record<string, "view" | "json">>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { code, toolCallResponses, activeToolCallId } = useAppSelector(
    (state) => state.responsePanel
  );

  const filteredResponses = activeMessageId
    ? toolCallResponses.filter(
        (response) => response.messageId === activeMessageId
      )
    : toolCallResponses;

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

  const handleClosePanel = () => {
    if (toolCallResponses.length > 0) {
      dispatch(saveToLocalStorage());
      toast.success("Changes saved to local storage");
    }
    dispatch(setResponsePanelWidth(0));
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setCodeData(value));
    }
  };

  useEffect(() => {
    if (
      filteredResponses.length > 0 &&
      (!activeToolCallId ||
        !filteredResponses.some((r) => r.tool_call_id === activeToolCallId))
    ) {
      dispatch(
        setActiveToolCallId(
          filteredResponses[filteredResponses.length - 1].tool_call_id
        )
      );
    }
  }, [filteredResponses, activeToolCallId, dispatch]);

  // Initialize view mode for each tool call
  useEffect(() => {
    const initialViewModes: Record<string, "view" | "json"> = {};
    filteredResponses.forEach((response) => {
      if (!viewMode[response.tool_call_id]) {
        initialViewModes[response.tool_call_id] = "view";
      }
    });

    if (Object.keys(initialViewModes).length > 0) {
      setViewMode((prev) => ({ ...prev, ...initialViewModes }));
    }
  }, [filteredResponses]);

  // Map tool call types to icons
  const getTabIcon = (type: string) => {
    switch (type) {
      case "graph":
        return <BarChart2 className="w-4 h-4" />;
      case "table":
        return <Table className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const getTabLabel = (response: ToolCallResponse) => {
    const toolName = response.tool_name?.split("/").pop() || "";
    return toolName || response.type;
  };

  const handleRefreshTable = (sheetId: string) => {
    // Implement refresh logic here
    toast.success("Refreshing table data...");
    // You might want to call an API or dispatch an action to refresh the data
  };

  const renderContent = (response: ToolCallResponse, mode: "view" | "json") => {
    if (mode === "json") {
      return (
        <div className="h-[calc(100vh-200px)] w-full">
          <Editor
            height="100%"
            width="100%"
            language="json"
            theme="vs-light"
            value={
              typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2)
            }
            onChange={handleEditorChange}
            options={{ minimap: { enabled: false } }}
          />
        </div>
      );
    }

    // View mode
    switch (response.type) {
      case "graph":
        return response.data ? (
          <VisualizationView
            charts={response.data}
            title="Business Analytics Overview"
          />
        ) : (
          <p className="text-gray-500">No visualization data available</p>
        );
      case "table":
        return response.data ? (
          <div className="w-full h-full overflow-x-auto relative">
            <GoogleSheet sheetId={response.data.spreadsheet_url} />
          </div>
        ) : (
          <p className="text-gray-500">No table data available</p>
        );
      default:
        return (
          <div className="h-[calc(100vh-200px)] w-full">
            <Editor
              height="100%"
              width="100%"
              language="json"
              theme="vs-light"
              value={
                typeof response.data === "string"
                  ? response.data
                  : JSON.stringify(response.data, null, 2)
              }
              onChange={handleEditorChange}
              options={{ minimap: { enabled: false } }}
            />
          </div>
        );
    }
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full bg-white relative"
      key={`panel-${panelSize.width}-${panelSize.height}-${activeMessageId}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 hover:bg-gray-100 rounded-full"
        onClick={handleClosePanel}
        aria-label="Close panel"
      >
        <X size={18} />
      </Button>

      <Tabs
        value={activeToolCallId || undefined}
        onValueChange={(value) => dispatch(setActiveToolCallId(value))}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center p-4 border-b border-gray-200">
          <TabsList className="bg-transparent h-auto border-gray-600 rounded-md flex flex-nowrap overflow-x-auto w-fit pr-8">
            {filteredResponses.map((response) => (
              <TabsTrigger
                key={response.tool_call_id}
                value={response.tool_call_id}
                className="px-3 py-2 cursor-pointer data-[state=active]:bg-white min-w-[40px] flex-shrink-0 flex items-center gap-1"
                aria-label={response.type}
              >
                {getTabIcon(response.type)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {filteredResponses.map((response) => (
          <TabsContent
            key={response.tool_call_id}
            value={response.tool_call_id}
            className="flex-1 p-4 overflow-auto relative h-full"
          >
            {response.type === "table" &&
              viewMode[response.tool_call_id] === "view" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-6 cursor-pointer right-6 z-10 bg-white shadow-sm"
                  onClick={() => handleRefreshTable(response.data as string)}
                  aria-label="Refresh table"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Refresh
                </Button>
              )}

            <Tabs
              value={viewMode[response.tool_call_id] || "view"}
              onValueChange={(value) =>
                setViewMode((prev) => ({
                  ...prev,
                  [response.tool_call_id]: value as "view" | "json",
                }))
              }
              className="w-full h-full flex flex-col"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="view" className="flex items-center gap-1">
                  <Eye size={16} />
                  View
                </TabsTrigger>
                <TabsTrigger value="json" className="flex items-center gap-1">
                  <FileJson size={16} />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="mt-0 flex-1 h-full">
                {renderContent(response, "view")}
              </TabsContent>

              <TabsContent value="json" className="mt-0 flex-1 h-full">
                {renderContent(response, "json")}
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ResponsePanel;
