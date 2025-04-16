"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ToolCallDisplayProps {
  toolName: string;
  toolArgs?: any;
  isLoading: boolean;
}

const ToolCallDisplay = ({
  toolName,
  toolArgs,
  isLoading,
}: ToolCallDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [savedToolArgs, setSavedToolArgs] = useState<any>(toolArgs);

  // Save toolArgs when it becomes available
  useEffect(() => {
    if (toolArgs) {
      setSavedToolArgs(toolArgs);
    }
  }, [toolArgs]);

  // Format the tool name for display (convert snake_case to Title Case)
  const formattedToolName = toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Use either the current toolArgs or the previously saved one
  const displayData = toolArgs || savedToolArgs;

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
      <div className="flex items-center p-3 bg-gray-200">
        <div className="flex-shrink-0 mr-3">
          {isLoading ? (
            <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse"></div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-gray-800">
            Tool Call: {formattedToolName}
            {isLoading && (
              <span className="ml-2 text-blue-500 text-sm">
                (Processing...)
              </span>
            )}
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-gray-600 hover:text-gray-800"
          aria-label={
            isExpanded
              ? "Collapse tool call details"
              : "Expand tool call details"
          }
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Tool Call Data:
          </h4>
          <div className="bg-gray-800 rounded-md p-3 text-gray-100 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(displayData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCallDisplay;
