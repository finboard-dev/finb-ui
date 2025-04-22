"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice";
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice";
import {
  Loader2,
  Code,
  BarChart2,
  Table,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolCallProps {
  toolCalls: Array<{
    name: string;
    args: any;
    id?: string;
  }>;
  isLoading?: boolean;
  messageId: string;
}

const ToolCallDisplay = ({
  toolCalls,
  isLoading = false,
  messageId,
}: ToolCallProps) => {
  const dispatch = useAppDispatch();
  const { toolCallResponses } = useAppSelector((state) => state.responsePanel);
  const [isExpanded, setIsExpanded] = useState(false);

  // Find responses associated with this message
  const messageResponses = toolCallResponses.filter(
    (response) => response.messageId === messageId
  );

  const handleOpenPanel = (toolCallId: string) => {
    // Set the active tool call id
    dispatch(setActiveToolCallId(toolCallId));

    // Open the response panel
    dispatch(setResponsePanelWidth(550));

    // Dispatch custom event to notify the parent components
    const event = new CustomEvent("toolCallSelected", {
      detail: { toolCallId, messageId },
    });
    window.dispatchEvent(event);
  };

  // Get the appropriate icon based on tool type
  const getToolIcon = (toolName: string) => {
    const toolType = toolName.toLowerCase();

    if (
      toolType.includes("graph") ||
      toolType.includes("chart") ||
      toolType.includes("visualization")
    ) {
      return <BarChart2 className="w-4 h-4" />;
    } else if (
      toolType.includes("table") ||
      toolType.includes("sheet") ||
      toolType.includes("data")
    ) {
      return <Table className="w-4 h-4" />;
    } else {
      return <Code className="w-4 h-4" />;
    }
  };

  // Format the tool name to be more readable
  const formatToolName = (name: string) => {
    // Remove path prefixes if present
    const simpleName = name.split("/").pop() || name;
    // Replace underscores with spaces and capitalize
    return simpleName
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Count completed tool calls
  const completedCount = messageResponses.length;
  const totalCount = toolCalls.length;

  return (
    <div className="mb-4">
      <div className="rounded-md border border-gray-200 bg-gray-50">
        {/* Card Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            <span className="font-medium">
              Tool Calls ({completedCount}/{totalCount} completed)
            </span>
          </div>
          <div className="flex items-center">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-3 space-y-2">
            {toolCalls.map((tool) => {
              const response = messageResponses.find(
                (resp) => resp.tool_call_id === tool.id
              );
              const isToolCompleted = !!response;

              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center gap-2">
                    {getToolIcon(tool.name)}
                    <span className="text-sm">{formatToolName(tool.name)}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => tool.id && handleOpenPanel(tool.id)}
                    className="text-xs h-8"
                    disabled={!isToolCompleted}
                  >
                    {!isToolCompleted ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        <span>Processing</span>
                      </>
                    ) : (
                      <span>View Results</span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolCallDisplay;
