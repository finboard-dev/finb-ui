"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { ChevronDown, ChevronUp, Terminal, Loader2 } from "lucide-react";
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice";
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice";

interface ToolCall {
  name: string;
  args: any;
  id?: string;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  isLoading: boolean;
}

const ToolCallDisplay = ({ toolCalls, isLoading }: ToolCallDisplayProps) => {
  const dispatch = useAppDispatch();
  const { toolCallResponses } = useAppSelector((state) => state.responsePanel);
  const [isExpanded, setIsExpanded] = useState(true);
  const [savedToolCalls, setSavedToolCalls] = useState<ToolCall[]>(toolCalls);
  const [expandedCalls, setExpandedCalls] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    if (toolCalls && toolCalls.length > 0) {
      setSavedToolCalls(toolCalls);

      // Set all new tool calls to expanded by default
      const expanded: Record<number, boolean> = {};
      toolCalls.forEach((_, index) => {
        expanded[index] = true;
      });
      setExpandedCalls(expanded);
    }
  }, [toolCalls]);

  const displayToolCalls = toolCalls.length > 0 ? toolCalls : savedToolCalls;

  const toggleCall = (index: number) => {
    setExpandedCalls((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Fixed handleToolCallClick function
  const handleToolCallClick = (toolCallId: string | undefined) => {
    if (!toolCallId) return;

    // Find matching tool call response by ID
    const matchingResponse = toolCallResponses.find(
      (response) => response.tool_call_id === toolCallId
    );

    if (matchingResponse) {
      // Set active tab and ensure response panel is visible
      dispatch(setActiveToolCallId(matchingResponse.tool_call_id));
      dispatch(setResponsePanelWidth(550));
    } else {
      // If no direct match, try to find by tool name
      const toolCall = toolCalls.find((tc) => tc.id === toolCallId);

      if (toolCall) {
        // Look for any response with the same tool name
        const similarResponse = toolCallResponses.find(
          (response) =>
            response.tool_name.toLowerCase() === toolCall.name.toLowerCase()
        );

        if (similarResponse) {
          dispatch(setActiveToolCallId(similarResponse.tool_call_id));
          dispatch(setResponsePanelWidth(550));
        } else {
          // No matching tab found, show the panel anyway
          // This ensures the panel opens even if no exact match is found
          dispatch(setResponsePanelWidth(550));
        }
      }
    }
  };

  const getToolCallStatusClasses = (name: string) => {
    const colors: Record<string, string> = {
      search:
        "from-blue-400/20 to-blue-600/20 border-blue-400/30 text-blue-600",
      calculate:
        "from-purple-400/20 to-purple-600/20 border-purple-400/30 text-purple-600",
      fetch:
        "from-emerald-400/20 to-green-600/20 border-emerald-400/30 text-emerald-600",
      analyze:
        "from-amber-400/20 to-orange-500/20 border-amber-400/30 text-amber-600",
      default:
        "from-slate-300/20 to-slate-500/20 border-slate-400/30 text-slate-700",
    };

    const key =
      Object.keys(colors).find((k) =>
        name.toLowerCase().includes(k.toLowerCase())
      ) || "default";

    return colors[key];
  };

  const getToolCallIconGradient = (name: string) => {
    const gradients: Record<string, string> = {
      search: "from-blue-400 to-blue-600",
      calculate: "from-purple-400 to-purple-600",
      fetch: "from-emerald-400 to-green-600",
      analyze: "from-amber-400 to-orange-500",
      default: "from-slate-400 to-slate-600",
    };

    const key =
      Object.keys(gradients).find((k) =>
        name.toLowerCase().includes(k.toLowerCase())
      ) || "default";

    return gradients[key];
  };

  const getToolIcon = (name: string) => {
    if (name.toLowerCase().includes("search")) return "🔍";
    if (name.toLowerCase().includes("calculate")) return "🧮";
    if (name.toLowerCase().includes("fetch")) return "📡";
    if (name.toLowerCase().includes("analyze")) return "📊";
    return "🛠️";
  };

  return (
    <div className="mb-6 space-y-6">
      {displayToolCalls.map((toolCall, index) => {
        const isCallExpanded = expandedCalls[index] ?? isExpanded;
        const statusClasses = getToolCallStatusClasses(toolCall.name);
        const iconGradient = getToolCallIconGradient(toolCall.name);
        const toolIcon = getToolIcon(toolCall.name);

        return (
          <div
            key={toolCall.id || index}
            className={`border rounded-xl overflow-hidden shadow-lg transition-all bg-gradient-to-br backdrop-blur-md ${statusClasses} cursor-pointer`}
            style={{ backdropFilter: "blur(8px)" }}
            onClick={() => handleToolCallClick(toolCall.id)}
          >
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                toggleCall(index);
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-md`}
                >
                  <span className="text-lg">{toolIcon}</span>
                </div>
                <div>
                  <span className="font-semibold text-lg">{toolCall.name}</span>
                  <div className="text-xs opacity-75 mt-1 font-medium">
                    Tool Call #{index + 1}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label={isCallExpanded ? "Collapse" : "Expand"}
                >
                  {isCallExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>
            </div>

            {isCallExpanded && (
              <div className="border-t border-opacity-30">
                <pre className="bg-white/80 dark:bg-black/20 backdrop-blur-sm p-6 text-sm overflow-auto rounded-b-lg whitespace-pre-wrap text-slate-800 dark:text-slate-200 shadow-inner">
                  {JSON.stringify({ args: toolCall.args }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })}

      {isLoading && displayToolCalls.length === 0 && (
        <div className="flex items-center justify-center p-8 border rounded-xl bg-gradient-to-br from-slate-100/40 to-slate-200/40 backdrop-blur-sm shadow-lg">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shadow-md mr-4">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
          <span className="text-slate-700 font-medium">
            Loading tool calls...
          </span>
        </div>
      )}

      {!isLoading && displayToolCalls.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 border rounded-xl bg-gradient-to-br from-slate-100/40 to-slate-200/40 backdrop-blur-sm shadow-lg">
          <div className="bg-gradient-to-br from-slate-400 to-slate-600 p-4 rounded-full shadow-md mb-4">
            <Terminal size={28} className="text-white" />
          </div>
          <span className="text-slate-600 font-medium text-lg">
            No tool calls available
          </span>
          <p className="text-slate-500 text-sm mt-2">
            Tool calls will appear here when they're executed
          </p>
        </div>
      )}
    </div>
  );
};

export default ToolCallDisplay;
