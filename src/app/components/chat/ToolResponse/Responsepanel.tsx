"use client";

import type React from "react";
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
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  setCodeData,
  saveToLocalStorage,
  setActiveToolCallId,
  type ToolCallResponse,
} from "@/lib/store/slices/responsePanelSlice";
import { setResponsePanelWidth, setActiveMessageId } from "@/lib/store/slices/chatSlice";
import VisualizationView from "@/app/components/visualizationV1/VisualizationView";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import DynamicTable, { RowData } from "@/app/tests/components/DynamicTableRenderer";
import EChartsRenderer from "@/app/components/visualizationV2/VisualizationRenderer";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ResponsePanelProps {
  activeMessageId?: string;
  isOpen?: boolean;
  onSaveComponent?: (component: any) => void;
}

const saveComponentToLocalStorage = (response: ToolCallResponse) => {
  try {
    const componentType =
        response.type === "graph"
            ? "Visualization"
            : response.type === "table"
                ? "SQL"
                : "Python";

    let content: any;
    if (typeof response.data === "string") {
      content = response.data;
    } else {
      content = JSON.stringify(response.data);
    }

    const newBlockId = `block-${Date.now()}`;
    const componentData = {
      id: newBlockId,
      type: componentType,
      title:
          response.tool_name?.split("/").pop() || `${componentType} Component`,
      content: content,
      timestamp: new Date().toISOString(),
      originalType: response.type,
      metadata: {
        messageId: response.messageId,
        toolCallId: response.tool_call_id,
      },
    };

    const savedComponents = JSON.parse(
        localStorage.getItem("dashboardBlocks") || "[]"
    );

    savedComponents.push(componentData);
    localStorage.setItem("dashboardBlocks", JSON.stringify(savedComponents));

    return {
      success: true,
      blockId: newBlockId,
    };
  } catch (error) {
    console.error("Error saving component to localStorage:", error);
    return {
      success: false,
      error,
    };
  }
};

const ResponsePanel: React.FC<ResponsePanelProps> = ({
                                                       activeMessageId,
                                                       isOpen = true,
                                                       onSaveComponent,
                                                     }) => {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState<Record<string, "view" | "json">>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { code, toolCallResponses, activeToolCallId } = useAppSelector(
      (state) => state.responsePanel
  );

  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const activeChat = useAppSelector((state) =>
      state.chat.chats.find((chat) => chat.id === activeChatId)
  );
  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;

  // Filter responses by activeMessageId and optionally by activeToolCallId
  const filteredResponses = activeMessageId
      ? toolCallResponses.filter(
          (response) => response.messageId === activeMessageId
      )
      : toolCallResponses;

  const displayedResponses = activeToolCallId
      ? filteredResponses.filter(
          (response) => response.tool_call_id === activeToolCallId
      )
      : filteredResponses;

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
  }, [isOpen]);

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

  useEffect(() => {
    const handleToolCallSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ toolCallId: string; messageId: string }>;
      const { toolCallId, messageId } = customEvent.detail;
      console.log("toolCallSelected:", { toolCallId, messageId, currentActiveToolCallId: activeToolCallId });
      dispatch(setActiveToolCallId(toolCallId));
      dispatch(setResponsePanelWidth(500));
      if (messageId !== activeMessageId) {
        dispatch(setActiveMessageId(messageId));
      }
    };
    window.addEventListener("toolCallSelected", handleToolCallSelected);
    return () => window.removeEventListener("toolCallSelected", handleToolCallSelected);
  }, [dispatch, activeMessageId]);

  const handleClosePanel = () => {
    if (toolCallResponses.length > 0) {
      dispatch(saveToLocalStorage());
      toast.success("Changes saved to local storage");
    }
    dispatch(setResponsePanelWidth(0));
    setIsExpanded(false);
    setIsSheetOpen(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      dispatch(setCodeData(value));
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsSheetOpen(!isExpanded);
  };

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

  const handleRefreshTable = (sheetId: string) => {
    setViewMode((prev) => ({ ...prev }));
    toast.success("Table data refreshed!");
  };

  const handleSaveComponent = (response: ToolCallResponse) => {
    const result = saveComponentToLocalStorage(response);

    if (result.success) {
      toast.success(`Component saved to dashboard!`, {
        description: "You can now drag it onto your dashboard",
      });
    } else {
      toast.error("Failed to save component", {
        description: "Please try again or check console for errors",
      });
    }
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

    switch (response.type) {
      case "graph":
        return response.data?.schema ? (
            <EChartsRenderer config={response.data.schema} />
        ) : (
            <p className="text-gray-500">No visualization data available</p>
        );
      case "table":
        return response?.data ? (
            <div className="w-full h-full overflow-x-auto relative">
              <DynamicTable
                  data={Array.isArray(response.data) ? response.data : response.data.report_table}
                  title={response.data.report_name || "Table Data"}
                  isLoading={false}
                  error={null}
              />
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
                  language={response.type === "code" ? "javascript" : "json"}
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

  if (responsePanelWidth === 0) {
    return null;
  }

  const panelContent = (
      <div
          ref={panelRef}
          className={cn(
              "flex flex-col h-full bg-white relative transition-all duration-300 ease-in-out",
              isExpanded && "fixed inset-0 z-50"
          )}
          key={`panel-${panelSize.width}-${panelSize.height}-${activeMessageId}`}
      >
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 rounded-full"
              id="sidepanel-maximize-button"
              onClick={toggleExpand}
              aria-label={isExpanded ? "Minimize panel" : "Maximize panel"}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
          <Button
              variant="ghost"
              size="icon"
              id="sidepanel-close-button"
              className="hover:bg-gray-100 rounded-full"
              onClick={handleClosePanel}
              aria-label="Close panel"
          >
            <X size={18} />
          </Button>
        </div>

        <Tabs
            value={activeToolCallId || (displayedResponses[0]?.tool_call_id) || undefined}
            onValueChange={(value) => dispatch(setActiveToolCallId(value))}
            className="flex-1 flex flex-col"
        >
          <div className="flex items-center p-4 border-b border-gray-200">
            <TabsList className="bg-transparent h-auto border-gray-600 rounded-md flex flex-nowrap overflow-x-auto w-fit pr-8">
              {displayedResponses.map((response) => (
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

          {displayedResponses.map((response) => (
              <TabsContent
                  key={response.tool_call_id}
                  value={response.tool_call_id}
                  className="flex-1 p-4 overflow-auto relative h-full max-w-full"
                  style={{ overflowX: "hidden" }}
              >
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

                    <div className="absolute top-5 right-5 z-10 flex gap-2">
                      {panelSize.width > 300 ? (
                          <>
                            <Button
                                variant="outline"
                                size="sm"
                                id="save-component-button"
                                className="cursor-pointer bg-white shadow-sm flex items-center gap-1"
                                onClick={() => handleSaveComponent(response)}
                                aria-label="Save to dashboard"
                            >
                              <Save size={16} />
                            </Button>

                            {response.type === "table" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    id="refresh-table-button"
                                    className="cursor-pointer bg-white shadow-sm flex items-center gap-1"
                                    onClick={() => handleRefreshTable(response.data as string)}
                                    aria-label="Refresh table"
                                >
                                  <RefreshCw size={16} />
                                </Button>
                            )}
                          </>
                      ) : (
                          <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                id="more-options-button"
                                className="cursor-pointer bg-white shadow-sm flex items-center gap-1"
                                aria-label="More options"
                            >
                              <span className="sr-only">More options</span>
                              <div className="w-4 h-4 flex items-center justify-center">
                                <span className="block w-1 h-1 bg-black rounded-full"></span>
                                <span className="block w-1 h-1 bg-black rounded-full mx-1"></span>
                                <span className="block w-1 h-1 bg-black rounded-full"></span>
                              </div>
                            </Button>
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                              <ul className="py-1">
                                <li>
                                  <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => handleSaveComponent(response)}
                                  >
                                    Save to Dashboard
                                  </button>
                                </li>
                                {response.type === "table" && (
                                    <li>
                                      <button
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={() => handleRefreshTable(response.data as string)}
                                      >
                                        Refresh Table
                                      </button>
                                    </li>
                                )}
                              </ul>
                            </div>
                          </div>
                      )}
                    </div>
                  </TabsList>

                  <TabsContent value="view" className="mt-0 flex-1 h-full relative">
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

  if (isExpanded) {
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-full md:max-w-4xl p-0 border-l">
            <SheetTitle className="sr-only">Response Panel</SheetTitle>
            {panelContent}
          </SheetContent>
        </Sheet>
    );
  }

  return panelContent;
};

export default ResponsePanel;