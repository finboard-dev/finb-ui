"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, Search } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { useChatStream } from "@/hooks/useChatStreaming";
import { useSelectedCompany } from "@/hooks/useCustomConstants";

// Financial reports data
const FINANCIAL_REPORTS = [
  {
    id: "profit-loss",
    name: "Profit & Loss",
    command: "generate a profit and loss report",
    icon: "📊",
  },
  {
    id: "balance-sheet",
    name: "Balance Sheet",
    command: "generate a balance sheet",
    icon: "📑",
  },
  {
    id: "cash-flow",
    name: "Cash Flow",
    command: "generate a cash flow statement",
    icon: "💰",
  },
  {
    id: "income-statement",
    name: "Income Statement",
    command: "generate an income statement",
    icon: "📈",
  },
  {
    id: "annual-report",
    name: "Annual Report",
    command: "generate an annual report",
    icon: "📆",
  },
  {
    id: "quarterly-report",
    name: "Quarterly Report",
    command: "generate a quarterly report",
    icon: "🗓️",
  },
  {
    id: "expense-report",
    name: "Expense Report",
    command: "generate an expense report",
    icon: "💸",
  },
  {
    id: "tax-report",
    name: "Tax Report",
    command: "generate a tax report",
    icon: "📝",
  },
  {
    id: "budget-report",
    name: "Budget Analysis",
    command: "generate a budget analysis",
    icon: "🔍",
  },
  {
    id: "forecast-report",
    name: "Financial Forecast",
    command: "generate a financial forecast",
    icon: "🔮",
  },
];

type MessageInputProps = {
  placeholder?: string;
  showBorder?: boolean;
  className?: string;
};

type MentionType = {
  id: string;
  name: string;
  command: string;
  icon: string;
  startPos: number;
  endPos: number;
};

export default function MessageInput({
  placeholder = "Ask about your financial data...",
  showBorder = true,
  className = "",
}: MessageInputProps) {
  // Constants
  const placeholderText =
    "Ask about your financial data... e.g., Revenue for last quarter";

  // State
  const [inputValue, setInputValue] = useState("");
  const [mentions, setMentions] = useState<MentionType[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  // References
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // App state
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const activeChat = useAppSelector((state) =>
    state.chat.chats.find((chat) => chat.id === activeChatId)
  );
  const isResponding = activeChat?.chats[0]?.isResponding || false;

  const { sendMessage } = useChatStream();
  const selectedCompany = useSelectedCompany();

  // Filter reports based on search term
  const filteredReports = FINANCIAL_REPORTS.filter((report) =>
    report.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Check if company is selected
  const validSelectedCompany = () => {
    return !!(selectedCompany && selectedCompany.name);
  };

  // Handle click outside to close mention suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        setShowMentionSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset active index when filtered reports change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredReports.length]);

  // Update cursor position and check for mentions
  const updateCursorPosition = () => {
    if (!inputRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!inputRef.current.contains(range.commonAncestorContainer)) return;

    // Get text content and cursor position
    const text = inputRef.current.textContent || "";
    const position = range.startOffset;
    setCursorPosition(position);

    // Check for @ symbol before cursor
    let mentionStart = -1;
    for (let i = position - 1; i >= 0; i--) {
      if (text[i] === "@") {
        // Check if this @ is not inside an existing mention
        const insideExistingMention = mentions.some(
          (mention) => i >= mention.startPos && i <= mention.endPos
        );
        if (!insideExistingMention) {
          mentionStart = i;
          break;
        }
      } else if (/\s/.test(text[i])) {
        // Stop at whitespace
        break;
      }
    }

    if (mentionStart >= 0) {
      const filter = text.substring(mentionStart + 1, position);
      setMentionFilter(filter);
      setMentionStartPos(mentionStart);
      setShowMentionSuggestions(true);

      // Position the menu
      if (inputRef.current) {
        const rect = range.getBoundingClientRect();
        const inputRect = inputRef.current.getBoundingClientRect();

        setMenuPosition({
          top: rect.bottom - inputRect.top,
          left: Math.min(
            rect.left - inputRect.left,
            inputRef.current.clientWidth - 250
          ),
        });
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Handle input changes
  const handleInputChange = () => {
    if (!inputRef.current) return;

    const text = inputRef.current.textContent || "";
    setInputValue(text);

    // Update mentions array by checking which mention spans still exist in the DOM
    const currentMentionElements =
      inputRef.current.querySelectorAll("[data-mention-id]");
    const currentMentionIds = Array.from(currentMentionElements).map((el) =>
      el.getAttribute("data-mention-id")
    );

    // Filter out mentions that no longer exist in the DOM
    const updatedMentions = mentions.filter((mention) =>
      currentMentionIds.includes(mention.id)
    );

    // Update mentions state if it changed
    if (updatedMentions.length !== mentions.length) {
      setMentions(updatedMentions);
    }

    if (!isComposing) {
      updateCursorPosition();
    }
  };

  // Handle selecting a report from dropdown
  const handleSelectReport = (report: {
    id: string;
    name: string;
    command: string;
    icon: string;
  }) => {
    if (!inputRef.current) return;

    // Get current text
    const text = inputRef.current.textContent || "";

    // Create a new mention object
    const newMention: MentionType = {
      ...report,
      startPos: mentionStartPos,
      endPos: mentionStartPos + report.name.length + 1, // +1 for the @ symbol
    };

    // Add to mentions array
    setMentions([...mentions, newMention]);

    // Replace the @filter with the mention in the text
    const beforeMention = text.substring(0, mentionStartPos);
    const afterMention = text.substring(cursorPosition);

    // Create mention span
    const mentionSpan = document.createElement("span");
    mentionSpan.className =
      "inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm";
    mentionSpan.setAttribute("data-mention-id", report.id);
    mentionSpan.setAttribute("contenteditable", "false");
    mentionSpan.innerHTML = `@${report.name}`;

    // Clear the input content
    inputRef.current.innerHTML = "";

    // Add text before mention
    if (beforeMention) {
      const beforeTextNode = document.createTextNode(beforeMention);
      inputRef.current.appendChild(beforeTextNode);
    }

    // Add mention span
    inputRef.current.appendChild(mentionSpan);

    // Add space after mention
    const spaceNode = document.createTextNode(" ");
    inputRef.current.appendChild(spaceNode);

    // Add text after mention
    if (afterMention) {
      const afterTextNode = document.createTextNode(afterMention);
      inputRef.current.appendChild(afterTextNode);
    }

    // Close suggestions
    setShowMentionSuggestions(false);

    // Set cursor after the mention and space
    const newPosition = mentionStartPos + report.name.length + 2; // +2 for @ and space
    setCursorPosition(newPosition);

    // Focus and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();

        const selection = window.getSelection();
        if (selection) {
          // Find the position after the mention span and space
          let nodeIndex = 0;
          let offset = 0;
          let found = false;

          for (let i = 0; i < inputRef.current.childNodes.length; i++) {
            const node = inputRef.current.childNodes[i];
            if (node === mentionSpan) {
              // The next node should be the space
              if (i + 1 < inputRef.current.childNodes.length) {
                nodeIndex = i + 1;
                offset = 1; // After the space
                found = true;
                break;
              }
            }
          }

          if (found) {
            const range = document.createRange();
            range.setStart(inputRef.current.childNodes[nodeIndex], offset);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }, 0);

    // Update input value
    handleInputChange();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionSuggestions && filteredReports.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((activeIndex + 1) % filteredReports.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (activeIndex - 1 + filteredReports.length) % filteredReports.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectReport(filteredReports[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionSuggestions(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Update extractMentionsFromContent to ensure all fields are included
  const extractMentionsFromContent = () => {
    return mentions.map((mention) => ({
      id: mention.id,
      name: mention.name,
      icon: mention.icon,
      startPos: mention.startPos,
      endPos: mention.endPos,
    }));
  };

  // Update handleSubmit
  const handleSubmit = () => {
    if (!inputValue.trim() || isResponding || !activeChatId) {
      return;
    }

    // Get plain text and mentions
    const plainText = inputValue.trim();
    const extractedMentions = extractMentionsFromContent();

    // Create a structured message payload
    const messagePayload = {
      text: plainText,
      mentions: extractedMentions,
    };

    // Reset input
    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
    setInputValue("");
    setMentions([]);

    // Send the structured message
    sendMessage.mutate(messagePayload);
  };

  return (
    <div className={`${className} w-full max-w-4xl mx-auto px-4 py-8`}>
      <Card
        className={`${
          !showBorder
            ? "bg-transparent px-0 py-0 border-none"
            : "rounded-2xl bg-background-card -z-10 border-none px-3 py-3"
        }`}
      >
        <Card className="rounded-xl bg-white border-primary p-6">
          <div className="relative" ref={containerRef}>
            {/* Input Area */}
            <div
              ref={inputRef}
              contentEditable={
                !isResponding && validSelectedCompany() && !!activeChatId
              }
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => {
                setIsComposing(false);
                updateCursorPosition();
              }}
              onBlur={() => setTimeout(() => updateCursorPosition(), 100)}
              onFocus={updateCursorPosition}
              onClick={updateCursorPosition}
              className={`${
                showBorder ? "min-h-[40px]" : "min-h-[48px]"
              } px-2 py-2 text-base text-gray-800 focus:outline-none w-full empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none`}
              data-placeholder={
                isResponding ? "Waiting for response..." : placeholderText
              }
              suppressContentEditableWarning={true}
            ></div>

            {/* Mention suggestions dropdown */}
            {showMentionSuggestions && filteredReports.length > 0 && (
              <div
                ref={menuRef}
                className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 max-h-64 overflow-y-auto w-72"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50 rounded-t-lg">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {mentionFilter
                      ? `Results for "${mentionFilter}"`
                      : "Select a financial report"}
                  </span>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 flex flex-col items-center justify-center">
                    <div className="text-gray-300 text-4xl mb-2">🔍</div>
                    <div className="font-medium">No reports found</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Try a different search term
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredReports.map((report, index) => (
                      <div
                        key={report.id}
                        onClick={() => handleSelectReport(report)}
                        className={`px-3 py-2.5 cursor-pointer flex items-center gap-3 transition-colors ${
                          index === activeIndex
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                          {report.icon}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm ${
                              index === activeIndex
                                ? "text-blue-700 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            {report.name}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            Financial report
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center mt-3 gap-2">
            <div className="relative">
              <div className="flex items-center border border-primary rounded-lg px-2 py-1 cursor-pointer">
                {!selectedCompany?.name ? (
                   <span>
                     connect a company to proceed
                   </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-800 flex items-center justify-center"></div>
                    <span className="text-gray-800 font-medium">
                      {selectedCompany.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-grow"></div>

            <Button
              onClick={handleSubmit}
              id="send-chat-input-button"
              disabled={!inputValue.trim() || isResponding || !activeChatId}
              className={`rounded-full h-12 w-12 p-0 flex items-center justify-center ${
                !inputValue.trim() || isResponding || !activeChatId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              <ArrowUp className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Hint for @ mention */}
          {!showBorder && (
            <div className="text-xs text-gray-400 mt-2">
              Type <span className="font-medium">@</span> to mention a financial
              report
            </div>
          )}
        </Card>
      </Card>
    </div>
  );
}
