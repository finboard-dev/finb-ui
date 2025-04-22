// Updated ResponsePanel.tsx for your notebook folder
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Code, BarChart2, Table } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  setCodeData,
  saveToLocalStorage,
  resetToolCallResponses,
  setActiveToolCallId,
  ToolCallResponse,
} from "@/lib/store/slices/responsePanelSlice";
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice";
import VisualizationView from "../visualization/VisualizationView";
import GoogleSheet from "./GoogleSheetsEmbeded";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ResponsePanelProps {
  activeMessageId?: string;
}

const ResponsePanel = ({ activeMessageId }: ResponsePanelProps) => {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { code, toolCallResponses, activeToolCallId } = useAppSelector(
    (state) => state.responsePanel
  );

  // Filter tool call responses for the active message
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

  // Handle panel closing
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

  // Set the active tool call when the component mounts or the filtered responses change
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

  // Get tab label based on tool name and type
  const getTabLabel = (response: ToolCallResponse) => {
    const toolName = response.tool_name?.split("/").pop() || "";
    return toolName || response.type;
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full bg-white relative"
      key={`panel-${panelSize.width}-${panelSize.height}-${activeMessageId}`}
    >
      {/* Close button in the top-right corner */}
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
          <TabsList className="bg-transparent h-auto border-gray-500 rounded-md flex flex-nowrap overflow-x-auto w-full pr-8">
            {filteredResponses.map((response) => (
              <TabsTrigger
                key={response.tool_call_id}
                value={response.tool_call_id}
                className="px-3 py-2 data-[state=active]:bg-gray-100 min-w-[40px] flex-shrink-0 flex items-center gap-1"
                aria-label={response.type}
                title={getTabLabel(response)}
              >
                {getTabIcon(response.type)}
                <span className="truncate max-w-24 hidden sm:block">
                  {getTabLabel(response)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {filteredResponses.map((response) => (
          <TabsContent
            key={response.tool_call_id}
            value={response.tool_call_id}
            className="flex-1 p-4 overflow-auto"
          >
            {response.type === "graph" ? (
              response.data ? (
                <VisualizationView
                  charts={response.data}
                  title="Business Analytics Overview"
                />
              ) : (
                <p className="text-gray-500">No visualization data available</p>
              )
            ) : response.type === "table" ? (
              response.data ? (
                <div className="w-full h-full overflow-x-auto">
                  <GoogleSheet sheetId={response.data} />
                </div>
              ) : (
                <p className="text-gray-500">No table data available</p>
              )
            ) : (
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
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ResponsePanel;
