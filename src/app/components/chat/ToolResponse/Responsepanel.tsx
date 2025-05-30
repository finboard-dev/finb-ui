"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Code,
  BarChart3,
  Table as TableIcon,
  FileJson,
  ChevronDown,
  Check,
  PanelRightClose,
  ArrowRightFromLine,
  ArrowLeftFromLine,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { setActiveToolCallId, type ToolCallResponse } from "@/lib/store/slices/responsePanelSlice";
import { setResponsePanelWidth, setActiveMessageId } from "@/lib/store/slices/chatSlice";
import EChartsRenderer from "@/app/components/visualizationV2/VisualizationRenderer";
import DynamicTable from "@/app/tests/components/DynamicTableRenderer";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";


const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ResponsePanelProps {
  activeMessageId?: string | null;
  isOpen?: boolean;
  onSaveComponent?: (component: any) => void;
}

const getPythonCode = (response: ToolCallResponse): string | null => {
  if (typeof response.data === "string" && (response.type === "code" || response.type === "python")) {
    return response.data;
  }
  if (typeof response.data === "object" && response.data !== null && "code" in response.data && typeof response.data.code === "string") {
    return response.data.code;
  }
  return null;
};

const saveComponentToLocalStorageInternal = (response: ToolCallResponse, saveTarget?: string) => {
  try {
    const componentType =
        response.type === "graph" ? "Visualization" : response.type === "table" ? "SQL" : "Python";
    let content: any;
    const pythonCode = getPythonCode(response);

    if (response.type === "graph" && typeof response.data === "object" && response.data?.schema) {
      content = JSON.stringify(response.data.schema);
    } else if (response.type === "table" && typeof response.data === "object") {
      content = JSON.stringify(response.data);
    } else if (pythonCode) {
      content = pythonCode;
    } else if (typeof response.data === "string") {
      content = response.data;
    } else {
      content = JSON.stringify(response.data);
    }

    const newBlockId = `block-${Date.now()}`;
    const componentData = {
      id: newBlockId,
      type: componentType,
      title: response.tool_name?.split("/").pop() || `${componentType} Component`,
      content: content,
      timestamp: new Date().toISOString(),
      originalType: response.type,
      saveTarget: saveTarget || "General",
      metadata: {
        messageId: response.messageId,
        toolCallId: response.tool_call_id,
        ...(typeof response.data === "object" && response.data?.code && { hasPythonCode: true }),
        ...(typeof response.data === "object" && response.data?.schema && { hasSchema: true }),
      },
    };

    const savedComponents = JSON.parse(localStorage.getItem("dashboardBlocks") || "[]");
    savedComponents.push(componentData);
    localStorage.setItem("dashboardBlocks", JSON.stringify(savedComponents));
    return { success: true, blockId: newBlockId, component: componentData };
  } catch (error) {
    console.error("Error saving component to localStorage:", error);
    return { success: false, error };
  }
};

const ResponsePanel: React.FC<ResponsePanelProps> = ({ activeMessageId, isOpen, onSaveComponent }) => {
  const dispatch = useAppDispatch();
  const { toolCallResponses, activeToolCallId } = useAppSelector((state) => state.responsePanel);
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const activeChat = useAppSelector((state) =>
      state.chat.chats.find((chat) => chat.id === activeChatId)
  );
  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mainTab, setMainTab] = useState<"Output" | "History">("Output");
  const [outputView, setOutputView] = useState<"visual" | "code">("visual");
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const user = useAppSelector((state) => state.user.user);
  const selectedOrg = user?.selectedOrganization
  const companies = selectedOrg?.companies || []


  const filteredResponsesForMessage = toolCallResponses.filter((response) => {
    if (activeMessageId) {
      return response.messageId === activeMessageId;
    }
    return true;
  });

  const displayedResponses = activeMessageId ? filteredResponsesForMessage : toolCallResponses;

  const getAvailableViews = (response: ToolCallResponse | undefined): Array<"visual" | "code"> => {
    if (!response) return [];
    
    if (response.type === "graph") {
      const views: Array<"visual" | "code"> = ["visual"];
      
      // Only add Code tab if Python code exists
      const pythonCode = getPythonCode(response);
      if (pythonCode) {
        views.push("code");
      }
      
      return views;
    } else if (response.type === "table") {
      // For tables, show visual (table) and code (JSON) views
      return ["visual"];
    } else if (response.type === "error") {
      // For errors, only show visual (the error message)
      return ["visual"];
    } else if (response.type === "python" || response.type === "code") {
      // For code responses, only show code view
      return ["code"];
    }
    
    // Default for other types
    return ["visual"];
  };

  useEffect(() => {
    const handleToolCallSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ toolCallId: string; messageId: string }>;
      const { toolCallId, messageId } = customEvent.detail;
      
      // Find the selected response
      const selectedResponse = toolCallResponses.find(r => r.tool_call_id === toolCallId);
      
      // Only proceed if we have a valid response
      if (selectedResponse) {
        // Always set the active tool call ID and message ID regardless of whether we open the panel
        dispatch(setActiveToolCallId(toolCallId));
        if (messageId !== activeMessageId) {
          dispatch(setActiveMessageId(messageId));
        }
        
        // Check for specific "Invalid data format provided" error message
        const hasInvalidDataFormatError = 
          (typeof selectedResponse.data === 'string' && 
            selectedResponse.data.includes("Invalid data format provided")) ||
          (typeof selectedResponse.data === 'object' && 
            selectedResponse.data && 
            (selectedResponse.data.error === "Invalid data format provided" || 
             selectedResponse.data.localError === "Invalid data format provided"));
        
        // If it has the specific error message, don't open the panel
        if (hasInvalidDataFormatError) {
          return;
        }
        
        // For table type, check if report_table exists
        if (selectedResponse.type === "table") {
          try {
            const processedData = typeof selectedResponse.data === 'string'
              ? JSON.parse(selectedResponse.data || '{}')
              : selectedResponse.data;
              
            // Don't open panel if report_table is missing
            if (!processedData || !processedData.report_table) {
              return;
            }
          } catch (e) {
            // If parsing fails, don't open the panel
            return;
          }
        }
        
        // For graph type, verify we can render it
        if (selectedResponse.type === "graph" && !canRenderGraph(selectedResponse.data)) {
          return;
        }
        
        // For table type, verify we can render it and it has report_table
        if (selectedResponse.type === "table" && !canRenderTable(selectedResponse.data)) {
          return;
        }
        
        // For non-visualizable types, don't open the panel
        if (selectedResponse.type !== "graph" && selectedResponse.type !== "table") {
          return;
        }
        
        // If we made it here, open the panel
        dispatch(setResponsePanelWidth(500)); // Open the panel
        
        const availableViews = getAvailableViews(selectedResponse);
        if (availableViews.length > 0) {
          setOutputView(availableViews[0]);
        } else {
          setOutputView("visual");
        }
        setMainTab("Output");
      }
    };

    window.addEventListener("toolCallSelected", handleToolCallSelected);
    return () => window.removeEventListener("toolCallSelected", handleToolCallSelected);
  }, [dispatch, activeMessageId, toolCallResponses]);

  useEffect(() => {
    if (displayedResponses.length > 0) {
      const currentToolCallStillValid = displayedResponses.some(
          (r) => r.tool_call_id === activeToolCallId
      );
      if (!activeToolCallId || !currentToolCallStillValid) {
        const newActiveResponse = displayedResponses[displayedResponses.length - 1];
        dispatch(setActiveToolCallId(newActiveResponse.tool_call_id));
        const availableViews = getAvailableViews(newActiveResponse);
        if (availableViews.length > 0) {
          setOutputView(availableViews[0]);
        } else {
          setOutputView("visual");
        }
      }
    }
  }, [displayedResponses, activeToolCallId, dispatch]);

  // Determine if a renderer for tables and graphs can display the content
  const canRenderGraph = (data: any): boolean => {
    try {
      if (!data) return false;
      const graphData = typeof data === 'string' ? JSON.parse(data) : data;
      return !!(graphData?.schema || graphData);
    } catch {
      return false;
    }
  };
  
  const canRenderTable = (data: any): boolean => {
    try {
      if (!data) return false;
      
      // Only check for specific error patterns that we know cause issues
      // This is a much more targeted approach than before
      
      // Check for specific error message strings
      if (typeof data === 'string') {
        if (data.includes("Invalid data format provided")) {
          return false;
        }
        
        // Try to parse string data to check for error objects
        try {
          const parsedData = JSON.parse(data);
          
          // Only check for specific error messages
          if (parsedData && typeof parsedData === 'object' && 
              (parsedData.error === "Invalid data format provided" || 
               parsedData.localError === "Invalid data format provided")) {
            return false;
          }
          
          // For table type, we require report_table to be present
          if (!parsedData.report_table) {
            return false;
          }
          
          // For parsed data, continue with the parsed value
          data = parsedData;
        } catch {
          // If it's not valid JSON, we'll treat string data as non-renderable
          return false;
        }
      }
      
      // For object data, check only for specific error messages
      if (data && typeof data === 'object') {
        if (data.error === "Invalid data format provided" || 
            data.localError === "Invalid data format provided") {
          return false;
        }
        
        // Specifically require report_table for table data
        if (!data.report_table) {
          return false;
        }
      }
      
      // Process data to find the actual table content
      const dataToRender = data?.report_table;
      
      // Minimal structural validation - just ensure we have something to render
      if (!dataToRender) return false;
      
      // Allow empty arrays - the table renderer should handle this gracefully
      if (Array.isArray(dataToRender)) {
        return true;
      }
      
      // Object data should be allowed, even if empty - the renderer will decide how to display it
      if (typeof dataToRender === 'object') {
        return true;
      }
      
      // If we get here, the data is a primitive (non-object, non-array) value
      // These typically can't be rendered as tables
      return false;
    } catch {
      // For any other errors, default to false - don't try to render invalid data
      return false;
    }
  };
  
  const currentActiveResponse = displayedResponses.find(
      (response) => response.tool_call_id === activeToolCallId
  );

  // This first useEffect prevents auto-opening for invalid data formats on mount
  useEffect(() => {
    // This runs once on component mount - check if current active response should show panel
    if (currentActiveResponse && responsePanelWidth > 0) {
      // Check for specific invalid data format errors
      const hasInvalidDataFormatError = 
        (typeof currentActiveResponse.data === 'string' && 
          currentActiveResponse.data.includes("Invalid data format provided")) ||
        (typeof currentActiveResponse.data === 'object' && 
          currentActiveResponse.data && 
          (currentActiveResponse.data.error === "Invalid data format provided" || 
           currentActiveResponse.data.localError === "Invalid data format provided"));
      
      if (hasInvalidDataFormatError) {
        // Immediately close panel for known invalid format errors
        dispatch(setResponsePanelWidth(0));
        return;
      }
      
      // For tables, check if report_table is present
      if (currentActiveResponse.type === "table") {
        try {
          // For tables, check if report_table exists
          const processedData = typeof currentActiveResponse.data === 'string' 
            ? JSON.parse(currentActiveResponse.data || '{}') 
            : currentActiveResponse.data;
          
          // Close panel if report_table doesn't exist
          if (!processedData || !processedData.report_table) {
            dispatch(setResponsePanelWidth(0));
            return;
          }
        } catch (e) {
          // If parsing fails, don't show panel
          dispatch(setResponsePanelWidth(0));
          return;
        }
      }
      
      // For graphs, we should validate more strictly
      if (currentActiveResponse.type === "graph" && !canRenderGraph(currentActiveResponse.data)) {
        dispatch(setResponsePanelWidth(0));
        return;
      }
      
      // For non-visualizable types, close the panel
      if (currentActiveResponse.type !== "graph" && currentActiveResponse.type !== "table") {
        dispatch(setResponsePanelWidth(0));
      }
    }
  }, []); // Empty dependency array to run only on mount
  
  useEffect(() => {
    if (currentActiveResponse) {
      const availableViews = getAvailableViews(currentActiveResponse);
      
      // If current outputView is not valid for this response type, or if it's not the first one upon switching to a new response
      if (availableViews.length > 0 && !availableViews.includes(outputView)) {
        setOutputView(availableViews[0]);
      } else if (availableViews.length > 0 && mainTab === "Output" && outputView !== availableViews[0]) {
        // This logic can be fine-tuned. For now, if the view is valid, keep it.
        // If you always want the first tab on response change, even if current view is valid:
        // setOutputView(availableViews[0]);
      }
      
      // Check for specific "Invalid data format provided" error
      const hasInvalidDataFormatError = 
        (typeof currentActiveResponse.data === 'string' && 
          currentActiveResponse.data.includes("Invalid data format provided")) ||
        (typeof currentActiveResponse.data === 'object' && 
          currentActiveResponse.data && 
          (currentActiveResponse.data.error === "Invalid data format provided" || 
           currentActiveResponse.data.localError === "Invalid data format provided"));
      
      if (hasInvalidDataFormatError) {
        // Close panel for invalid data format errors
        dispatch(setResponsePanelWidth(0));
      } else if (currentActiveResponse.type === "table") {
        try {
          // For tables, check if report_table exists
          const processedData = typeof currentActiveResponse.data === 'string' 
            ? JSON.parse(currentActiveResponse.data || '{}') 
            : currentActiveResponse.data;
          
          // Close panel if report_table doesn't exist
          if (!processedData || !processedData.report_table) {
            dispatch(setResponsePanelWidth(0));
          }
        } catch (e) {
          // If parsing fails, don't show panel
          dispatch(setResponsePanelWidth(0));
        }
      } else if (currentActiveResponse.type === 'graph') {
        // For graphs, validate the data structure
        if (!canRenderGraph(currentActiveResponse.data)) {
          dispatch(setResponsePanelWidth(0));
        }
      } else if (currentActiveResponse.type !== 'graph' && currentActiveResponse.type !== 'table') {
        // Don't show panel for non-graph, non-table responses
        dispatch(setResponsePanelWidth(0));
      }
    } else {
      setOutputView("visual"); // Default if no active response
    }
  }, [currentActiveResponse, mainTab, dispatch]); // outputView removed from deps to avoid loop, manage externally

  const handleClosePanel = () => {
    dispatch(setResponsePanelWidth(0));
    setIsExpanded(false);
    setIsSheetOpen(false);
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    setIsSheetOpen(newExpandedState);
    if (!newExpandedState && responsePanelWidth === 0) {
      dispatch(setResponsePanelWidth(500)); // Or your default width
    }
  };

  const handleSaveCurrentResponse = () => {
    if (currentActiveResponse) {
      const saveResults = Array.from(selectedCompanies).map(companyId => {
        const targetCompany = companies.find(c => c.id === companyId);
        const result = saveComponentToLocalStorageInternal(
            currentActiveResponse,
            targetCompany?.name || companyId
        );
        return { companyId, ...result };
      });

      const successCount = saveResults.filter(r => r.success).length;

      if (successCount > 0) {
        toast.success(`Component saved to ${successCount} selected ${successCount === 1 ? 'company' : 'companies'}!`);
        saveResults.forEach(result => {
          if (result.success && onSaveComponent && result.component) {
            onSaveComponent(result.component);
          }
        });
      } else {
        toast.error('Failed to save component to any selected company');
      }

      setIsSaveDropdownOpen(false);
      setSelectedCompanies(new Set());
    } else {
      toast.error("No active response to save.");
    }
  };


  const getIconForResponseType = (type: string) => {
    // ... (remains the same)
    switch (type) {
      case "graph":
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
      case "table":
        return <TableIcon className="w-4 h-4 text-gray-500" />;
      case "python":
      case "code":
        return <Code className="w-4 h-4 text-gray-500" />;
      default:
        return <FileJson className="w-4 h-4 text-gray-500" />;
    }
  };

  const getViewIcon = (viewType: "visual" | "code" | "json") => {
    switch (viewType) {
      case "visual":
        return <BarChart3 size={16} />;
      case "code":
        return <Code size={16} />;
      case "json":
        return <FileJson size={16} />; // Icon for the JSON tab
      default:
        return <BarChart3 size={16} />;
    }
  };

  const getViewLabel = (viewType: "visual" | "code" | "json", responseType: string) => {
    switch (viewType) {
      case "visual":
        return responseType === "graph" ? "Chart" : responseType === "table" ? "Table" : "View";
      case "code": // "Code" tab: Python for graph, specific JSON for table, Python for python type
        return "Code";
      case "json": // "JSON" tab: Graph config for graph type
        return "JSON";
      default:
        return "View";
    }
  };


  const renderOutputContentArea = (response: ToolCallResponse | undefined, view: "visual" | "code") => {
    if (!response) {
      return (
          <div className="w-full h-[450px] flex items-center justify-center text-gray-400">
            <p>No data available for this response.</p>
          </div>
      );
    }
  
    const fixedHeightClass = "h-[450px] flex flex-col";
    const pythonCode = getPythonCode(response);
  
    const safeParseJSON = (data: any) => {
      if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return data; }
      }
      return data;
    };
    const processedData = safeParseJSON(response.data);
  
    if (view === "visual") {
      switch (response.type) {
        case "graph":
          const graphData = processedData?.schema || processedData;
          if (graphData) {
            return (
                <div className={`w-full ${fixedHeightClass} flex-1 border border-gray-300 rounded-md p-2 bg-white`}>
                  <EChartsRenderer config={graphData} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                </div>
            );
          }
          break;
        case "table":
          const tableData = processedData?.report_table;
          if (tableData) {
            return (
                <div className="w-full h-full flex-1 rounded-md bg-white">
                  <DynamicTable 
                    data={tableData} 
                    title={processedData?.report_name || "Table Data"} 
                    isLoading={false} 
                    error={null}
                    maxHeight="420px"
                  />
                </div>
            );
          } else {
            return (
                <div className={`w-full ${fixedHeightClass} flex items-center justify-center text-gray-400 border border-gray-300 rounded-md bg-white`}>
                  <p>No table data available. Missing report_table property.</p>
                </div>
            );
          }
          break;
        case "python":
        case "code":
          if (pythonCode) {
            return (
                <div className={`${fixedHeightClass} w-full border border-gray-300 rounded-md overflow-hidden bg-white`}>
                  <Editor height="100%" width="100%" language="python" theme="vs-light" value={pythonCode} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }} />
                </div>
            );
          } else if (typeof processedData === 'string') { // Or raw string data if it's a "code" type without specific python
            return (
                <div className={`${fixedHeightClass} w-full border border-gray-300 rounded-md overflow-hidden bg-white`}>
                  <Editor height="100%" width="100%" language="plaintext" theme="vs-light" value={processedData} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }} />
                </div>
            );
          }
          break;
        default: // Default visual is JSON representation
          const defaultContent = typeof processedData === 'string' ? processedData : JSON.stringify(processedData, null, 2);
          return (
              <div className={`${fixedHeightClass} w-full border border-gray-300 rounded-md overflow-hidden bg-white`}>
                <Editor height="100%" width="100%" language="json" theme="vs-light" value={defaultContent} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}/>
              </div>
          );
      }
    } else if (view === "code") {
      let codeContentValue: string | null = null;
      let language = "plaintext";
  
      if (response.type === "graph") {
        if (pythonCode) {
          codeContentValue = pythonCode;
          language = "python";
        } else {
          return (
              <div className={`${fixedHeightClass} w-full flex items-center justify-center text-center text-gray-500 border border-gray-300 rounded-md bg-white p-4`}>
                <p>No executable Python code available for this graph.</p>
              </div>
          );
        }
      } else if (response.type === "python") { // Specifically for "python" type response
        codeContentValue = pythonCode || (typeof processedData === 'string' ? processedData : JSON.stringify(processedData, null, 2));
        language = "python"; // Assume it's always python for this type
      } else if (response.type === "code") { // For generic "code" type response
        if (pythonCode) { // If there's specifically extracted python code
          codeContentValue = pythonCode;
          language = "python";
        } else if (typeof processedData === 'string') {
          codeContentValue = processedData;
          try { JSON.parse(processedData); language = "json"; } catch (e) { language = "plaintext"; }
        } else {
          codeContentValue = JSON.stringify(processedData, null, 2);
          language = "json";
        }
      } else { // Default for other unknown types under "code" view - show raw data as JSON
        codeContentValue = typeof processedData === 'string' ? processedData : JSON.stringify(processedData, null, 2);
        language = "json";
      }
  
      if (codeContentValue !== null) {
        return (
            <div className={`${fixedHeightClass} w-full border border-gray-300 rounded-md overflow-hidden bg-white`}>
              <Editor height="100%" width="100%" language={language} theme="vs-light" value={codeContentValue} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }} />
            </div>
        );
      }
    }

    // Fallback if no content could be rendered
    return (
        <div className={`w-full ${fixedHeightClass} flex items-center justify-center text-gray-400 border border-gray-300 rounded-md bg-white`}>
          <p>Unable to display content.</p>
        </div>
    );
  };


  if (responsePanelWidth === 0 && !isExpanded) {
    return null;
  }

  const panelDisplayContent = (
      <div
          ref={panelRef}
          className={cn(
              "flex flex-col h-full bg-white relative transition-all duration-300 ease-in-out border-l border-[#E5E7EB] overflow-hidden",
              isExpanded ? "w-full" : ""
          )}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-3 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-200 rounded-full w-8 h-8 text-gray-600 hover:text-gray-900"
                onClick={handleClosePanel}
                aria-label="Close panel"
            >
              <PanelRightClose size={18} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-200 rounded-full w-8 h-8 text-gray-600 hover:text-gray-900"
                onClick={toggleExpand}
                aria-label={isExpanded ? "Minimize panel" : "Maximize panel"}
            >
              {isExpanded ?  <ArrowRightFromLine size={16} /> : <ArrowLeftFromLine size={16} />}
            </Button>
          </div>
          <div className="flex bg-[#F3F4F6] rounded-lg p-0.5">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setMainTab("Output")}
                className={`px-3 py-1 text-xs font-medium rounded-[5px] transition-all ${
                    mainTab === "Output" ? "bg-[#4F7CFF] text-white shadow-sm" : "text-[#374151] hover:text-black hover:bg-gray-200"
                }`}
            >
              Output
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setMainTab("History")}
                className={`px-3 py-1 text-xs font-medium rounded-[5px] transition-all ${
                    mainTab === "History" ? "bg-[#4F7CFF] text-white shadow-sm" : "text-[#374151] hover:text-black hover:bg-gray-200"
                }`}
            >
              History
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {mainTab === "Output" && (
              <div className="p-4 w-full">
                {currentActiveResponse ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center bg-[#F5F7FB] rounded-lg p-1 gap-1">
                          {getAvailableViews(currentActiveResponse).map((viewType) => (
                              <Button
                                  key={viewType}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setOutputView(viewType)}
                                  className={`px-3 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs font-medium transition-all ${
                                      outputView === viewType
                                          ? "bg-white shadow text-[#374151] border border-gray-300"
                                          : "text-gray-500 hover:bg-gray-200"
                                  }`}
                                  aria-label={`${getViewLabel(viewType, currentActiveResponse.type)} View`}
                              >
                                {getViewIcon(viewType)}
                                {getViewLabel(viewType, currentActiveResponse.type)}
                              </Button>
                          ))}
                        </div>
                        <DropdownMenu open={isSaveDropdownOpen} onOpenChange={setIsSaveDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button className="bg-[#4F7CFF] hover:bg-[#3B6BFF] text-white font-semibold py-2 px-4 rounded-md shadow-sm text-sm flex items-center gap-1.5">
                              Save to <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 select-none bg-white border-gray-200 shadow-xl rounded-lg p-0">
                            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                              {selectedOrg && (
                                  <div className="space-y-1">
                                    <div
                                        onClick={() => {
                                          if (selectedCompanies.size === companies.length) {
                                            // If all companies are selected, deselect all
                                            setSelectedCompanies(new Set());
                                          } else {
                                            // Select all companies
                                            setSelectedCompanies(new Set(companies.map(c => c.id)));
                                          }
                                        }}
                                        className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                                    >
                                      <span className="font-medium text-gray-800">{selectedOrg.name}</span>
                                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center 
            ${selectedCompanies.size === companies.length ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}
                                      >
                                        {selectedCompanies.size === companies.length && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                    </div>

                                    <div className="ml-4 space-y-1">
                                      {companies.map((company) => (
                                          <div
                                              key={company.id}
                                              onClick={() => {
                                                const newSelected = new Set(selectedCompanies);
                                                if (selectedCompanies.has(company.id)) {
                                                  newSelected.delete(company.id);
                                                } else {
                                                  newSelected.add(company.id);
                                                }
                                                setSelectedCompanies(newSelected);
                                              }}
                                              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                                          >
                                            <span className="text-gray-600">{company.name}</span>
                                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center 
                ${selectedCompanies.has(company.id) ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}
                                            >
                                              {selectedCompanies.has(company.id) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                          </div>
                                      ))}
                                    </div>
                                  </div>
                              )}
                            </div>
                            <div className="border-t border-gray-200 mt-1 p-2">
                              <Button
                                  variant="outline"
                                  className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-semibold py-2 text-sm"
                                  onClick={handleSaveCurrentResponse}
                                  disabled={selectedCompanies.size === 0}
                              >
                                Save
                              </Button>
                            </div>
                          </DropdownMenuContent>

                        </DropdownMenu>
                      </div>
                      <div className="flex-1 flex flex-col">
                        {renderOutputContentArea(currentActiveResponse, outputView)}
                      </div>
                    </>
                ) : (
                    // ... No Output Available placeholder ... (remains the same)
                    <div className="w-full h-[450px] flex flex-col items-center justify-center text-center text-gray-500">
                      <FileJson size={40} className="mb-3 text-gray-300" />
                      <p className="text-md font-medium text-gray-600">No Output Available</p>
                      {displayedResponses.length > 0 ? (
                          <p className="text-xs mt-1 text-gray-400">Select an item from history to view output.</p>
                      ) : (
                          <p className="text-xs mt-1 text-gray-400">No tool outputs available.</p>
                      )}
                    </div>
                )}
              </div>
          )}
          {mainTab === "History" && (
              <div className="p-4 w-full overflow-y-auto">
                <h3 className="text-base font-semibold mb-3 text-[#111827] sticky top-0 bg-white py-2 z-[1]">
                  {activeMessageId ? "History for current message" : "All History"}
                </h3>
                {displayedResponses.length > 0 ? (
                    <ul className="space-y-1.5">
                      {displayedResponses.map((response) => (
                          <li
                              key={response.tool_call_id}
                              className={cn(
                                  "p-2.5 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors",
                                  activeToolCallId === response.tool_call_id ? "bg-blue-50 border-blue-400 shadow-sm" : "border-gray-200"
                              )}
                              onClick={() => {
                                dispatch(setActiveToolCallId(response.tool_call_id));
                                setMainTab("Output");
                                const availableViews = getAvailableViews(response);
                                if (availableViews.length > 0) {
                                  setOutputView(availableViews[0]);
                                } else {
                                  setOutputView("visual"); // Fallback
                                }
                              }}
                          >
                            <div className="flex items-center gap-2 text-xs">
                              {getIconForResponseType(response.type)}
                              <span
                                  className="font-medium text-gray-700 truncate max-w-[200px] sm:max-w-none"
                                  title={response.tool_name || response.type}
                              >
                                {response.tool_name?.split("/").pop() || response.type}
                              </span>
                            </div>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <div className="h-[450px] flex items-center justify-center text-gray-400">
                      <p>No history available.</p>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );

  if (isExpanded) {
    return (
        <Sheet
            open={isSheetOpen}
            onOpenChange={(open) => {
              setIsSheetOpen(open);
              if (!open) setIsExpanded(false);
            }}
        >
          <SheetContent side="right" className="w-full sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] p-0 border-l-0 overflow-hidden">
            <SheetTitle className="sr-only">Expanded Response Panel</SheetTitle>
            {panelDisplayContent}
          </SheetContent>
        </Sheet>
    );
  }

  return responsePanelWidth > 0 ? panelDisplayContent : null;
};

export default ResponsePanel;