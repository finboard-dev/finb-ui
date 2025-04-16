"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, Search } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { useChatStream } from "@/hooks/useChatStreaming";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";
import dynamic from "next/dynamic";
import {
  EditorState,
  CompositeDecorator,
  ContentState,
  Modifier,
  convertToRaw,
  getDefaultKeyBinding,
  ContentBlock,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";

// Import Draft.js Editor component with SSR disabled
const Editor = dynamic(() => import("draft-js").then((mod) => mod.Editor), {
  ssr: false,
});

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

type MessageInput = {
  placeholder?: string;
  showBorder?: boolean;
  className?: string;
};

// Entity types for mentions
const MENTION_ENTITY = "MENTION";

// Mention component to render mentions
const Mention = (props: any) => {
  const { report } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <span
      className="inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm"
      data-mention-id={report.id}
    >
      <span className="mr-1">{report.icon}</span>@{report.name}
    </span>
  );
};

export default function MessageInput({
  placeholder = "Ask about your financial data...",
  showBorder = true,
  className,
}: MessageInput) {
  //constants
  const placeholderText =
    "Ask about your financial data... e.g., Revenue for last quarter";

  // Use client-side only initialization
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // State for the editor - initialize only on client
  const decorator = useMemo(() => createDecorator(), []);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(decorator)
  );
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionSelection, setMentionSelection] = useState({
    start: 0,
    end: 0,
  });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  // References
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // App state
  const { isResponding } = useAppSelector((state) => state.chat);
  const { sendMessage } = useChatStream();
  const selectedCompany = useSelectedCompany();

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Create decorator for mentions
  function createDecorator() {
    return new CompositeDecorator([
      {
        strategy: findMentionEntities,
        component: Mention,
      },
    ]);
  }

  // Strategy to find mention entities
  function findMentionEntities(
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState
  ) {
    contentBlock.findEntityRanges((character: { getEntity: () => any }) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === MENTION_ENTITY
      );
    }, callback);
  }

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

  // Position the menu based on cursor position
  useEffect(() => {
    if (showMentionSuggestions && editorRef.current) {
      const editorRoot = editorRef.current.editor;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRoot?.getBoundingClientRect();
        if (!editorRect) return;

        setMenuPosition({
          top: rect.bottom - editorRect.top,
          left: Math.min(
            rect.left - editorRect.left,
            editorRoot ? editorRoot.clientWidth - 250 : 0
          ),
        });
      }
    }
  }, [showMentionSuggestions]);

  useEffect(() => {
    // Find the editor DOM node after render
    if (containerRef.current) {
      const editorNode =
        containerRef.current.querySelector(".DraftEditor-root");
      if (editorNode) {
        // Now you can store a reference to the DOM node
        // This can be used for focusing, etc.
      }
    }
  }, [editorState]);

  // Handle editor changes
  const handleEditorChange = (newState: React.SetStateAction<EditorState>) => {
    const selection = (newState as EditorState).getSelection();
    const content = (newState as EditorState).getCurrentContent();
    const currentBlock = content.getBlockForKey(selection.getStartKey());
    const blockText = currentBlock.getText();
    const cursorPosition = selection.getStartOffset();

    // Check if we're in a potential mention situation
    if (blockText.length > 0) {
      // Find the @ symbol before cursor
      let mentionStartPos = -1;
      for (let i = cursorPosition - 1; i >= 0; i--) {
        if (blockText.charAt(i) === "@") {
          // Make sure this @ is not inside an existing mention entity
          const entityKey = currentBlock.getEntityAt(i);
          if (!entityKey) {
            mentionStartPos = i;
            break;
          }
        } else if (/\s/.test(blockText.charAt(i))) {
          // Stop at whitespace
          break;
        }
      }

      if (mentionStartPos >= 0) {
        // Extract the current filter text
        const filter = blockText.substring(mentionStartPos + 1, cursorPosition);
        setMentionFilter(filter);
        setMentionSelection({
          start: mentionStartPos,
          end: cursorPosition,
        });
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }

    setEditorState(newState);
  };

  // Handle selecting a report from dropdown
  const handleSelectReport = (report: {
    id?: string;
    name: any;
    command?: string;
    icon?: string;
  }) => {
    // Get current selection and content
    const selectionState = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    // Create a selection for the entire mention text including @
    const mentionRange: SelectionState = selectionState.merge({
      anchorOffset: mentionSelection.start,
      focusOffset: mentionSelection.end,
    });

    // Create the entity for the mention
    const contentStateWithEntity = contentState.createEntity(
      MENTION_ENTITY,
      "IMMUTABLE",
      { report }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    // Replace the selection with mention text and apply the entity
    const mentionText = `@${report.name}`;
    const contentStateWithMention = Modifier.replaceText(
      contentStateWithEntity,
      mentionRange,
      mentionText,
      undefined,
      entityKey
    );

    // Add a space after the mention
    const spaceOffset = mentionSelection.start + mentionText.length;
    const selectionAfterMention = contentStateWithMention
      .getSelectionAfter()
      .merge({
        anchorOffset: spaceOffset,
        focusOffset: spaceOffset,
      });

    const contentStateWithSpace = Modifier.insertText(
      contentStateWithMention,
      selectionAfterMention,
      " "
    );

    // Create new editor state
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithSpace,
      "insert-characters"
    );

    // Move cursor after the space
    const newSelection = newEditorState.getSelection().merge({
      anchorOffset: spaceOffset + 1,
      focusOffset: spaceOffset + 1,
    });

    const editorStateWithNewSelection = EditorState.forceSelection(
      newEditorState,
      newSelection
    );

    // Update state
    setEditorState(editorStateWithNewSelection);
    setShowMentionSuggestions(false);

    // Focus editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 0);
  };

  const handleBackspace = (editorState: EditorState) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return "not-handled"; // Let default behavior handle selections
    }

    const contentState = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const cursorOffset = selection.getStartOffset();

    // Check if cursor is inside or immediately after a mention entity
    if (cursorOffset > 0) {
      // Check the character before the cursor (or two positions before if at boundary)
      let checkOffset = cursorOffset - 1;
      let entityKey = block.getEntityAt(checkOffset);

      // If cursor is after the mention (e.g., at the space), check one position further back
      if (!entityKey && cursorOffset > 1) {
        checkOffset = cursorOffset - 2;
        entityKey = block.getEntityAt(checkOffset);
      }

      if (
        entityKey &&
        contentState.getEntity(entityKey).getType() === MENTION_ENTITY
      ) {
        // Find the mention entity's range
        let startOffset = checkOffset;
        let endOffset = checkOffset + 1;

        // Move startOffset to the beginning of the entity
        while (
          startOffset > 0 &&
          block.getEntityAt(startOffset - 1) === entityKey
        ) {
          startOffset--;
        }

        // Move endOffset to the end of the entity
        while (
          endOffset < block.getLength() &&
          block.getEntityAt(endOffset) === entityKey
        ) {
          endOffset++;
        }

        // Include trailing space if it exists
        if (
          endOffset < block.getLength() &&
          block.getText()[endOffset] === " "
        ) {
          endOffset++;
        }

        // Create a selection for the entire mention (and trailing space)
        const mentionSelection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: startOffset,
          focusOffset: endOffset,
        });

        // Remove the mention text and trailing space
        let newContentState = Modifier.removeRange(
          contentState,
          mentionSelection,
          "backward"
        );

        // Update the editor state
        let newEditorState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );

        // Ensure cursor is positioned correctly after deletion
        const newSelection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: startOffset,
          focusOffset: startOffset,
        });

        newEditorState = EditorState.forceSelection(
          newEditorState,
          newSelection
        );

        setEditorState(newEditorState);
        return "handled";
      }
    }

    return "not-handled";
  };

  // Handle key commands
  const handleKeyCommand = (command: string, editorState: EditorState) => {
    if (command === "submit") {
      handleSubmit();
      return "handled";
    }
    if (command === "backspace") {
      return handleBackspace(editorState);
    }
    return "not-handled";
  };

  // Custom key binding for Enter to submit
  const keyBindingFn = (e: React.KeyboardEvent<{}>) => {
    if (showMentionSuggestions && filteredReports.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((activeIndex + 1) % filteredReports.length);
        return null;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (activeIndex - 1 + filteredReports.length) % filteredReports.length
        );
        return null;
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectReport(filteredReports[activeIndex]);
        return null;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return null;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      return "submit";
    } else if (e.key === "Backspace") {
      return "backspace";
    }

    return getDefaultKeyBinding(e);
  };

  // Extract mentions from content
  const extractMentionsFromContent = (contentState: ContentState) => {
    const mentions: any[] = [];
    const blocks = convertToRaw(contentState).blocks;

    // Go through all blocks
    blocks.forEach((block) => {
      // Check for entity ranges
      if (block.entityRanges.length > 0) {
        const entityMap = convertToRaw(contentState).entityMap;

        // Process each entity
        block.entityRanges.forEach((range) => {
          const entity = entityMap[range.key];
          if (entity.type === MENTION_ENTITY) {
            mentions.push(entity.data.report);
          }
        });
      }
    });

    return mentions;
  };

  // Submit the message
  const handleSubmit = () => {
    const contentState = editorState.getCurrentContent();
    if (!contentState.hasText() || isResponding) {
      return;
    }

    // Get plain text
    const blocks = convertToRaw(contentState).blocks;
    const messageText = blocks.map((block) => block.text).join("\n");

    // Extract mentions
    const mentions = extractMentionsFromContent(contentState);

    // Prepare the message with mentions appended as commands
    let messageToSend = messageText.trim();
    if (mentions.length > 0) {
      messageToSend +=
        "\n" + mentions.map((mention) => `[${mention.command}]`).join("\n");
    }

    // Reset input
    setEditorState(EditorState.createEmpty(createDecorator()));

    // Send message
    sendMessage.mutate(messageToSend);
  };

  // Function to set editor reference
  const setEditorReference = (editor: any) => {
    editorRef.current = editor;
  };

  // Render placeholder while client-side hydration is happening
  if (!isClient) {
    return (
      <div className={`${className}w-full max-w-4xl mx-auto px-4 py-8`}>
        <Card
          className={`${
            !showBorder
              ? "bg-transparent px-0 py-0 border-none"
              : "rounded-2xl bg-background-card -z-10 border-none px-3 py-3"
          }`}
        >
          <Card className="rounded-xl bg-white border-primary p-6">
            <div className="relative">
              <div
                className={`${
                  showBorder ? "min-h-[40px]" : "min-h-[48px]"
                } px-2 py-2 text-base text-gray-800 focus:outline-none w-full`}
              >
                <div className="text-gray-400">{placeholderText}</div>
              </div>
            </div>
            <div className="flex items-center mt-3 gap-2">
              <div className="relative">
                <div className="flex items-center border border-primary rounded-lg px-2 py-1 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="flex-grow"></div>
              <Button
                disabled={true}
                className="rounded-full h-12 w-12 p-0 flex items-center justify-center bg-gray-400 cursor-not-allowed"
              >
                <ArrowUp className="h-5 w-5 text-white" />
              </Button>
            </div>
          </Card>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${className}w-full max-w-4xl mx-auto px-4 py-8`}>
      <Card
        className={`${
          !showBorder
            ? "bg-transparent px-0 py-0 border-none"
            : "rounded-2xl bg-background-card -z-10 border-none px-3 py-3"
        }`}
      >
        <Card className="rounded-xl bg-white border-primary p-6">
          <div className="relative" ref={containerRef}>
            {/* Editor */}
            <div
              className={`${
                showBorder ? "min-h-[40px]" : "min-h-[48px]"
              } px-2 py-2 text-base text-gray-800 focus:outline-none w-full`}
            >
              {Editor && (
                <div onClick={focusEditor}>
                  <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    placeholder={
                      isResponding ? "Waiting for response..." : placeholderText
                    }
                    readOnly={isResponding || !validSelectedCompany()}
                    handleKeyCommand={handleKeyCommand}
                    keyBindingFn={keyBindingFn}
                    stripPastedStyles={true}
                  />
                </div>
              )}
            </div>

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
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  </div>
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
              disabled={
                !editorState.getCurrentContent().hasText() || isResponding
              }
              className={`rounded-full h-12 w-12 p-0 flex items-center justify-center ${
                !editorState.getCurrentContent().hasText() || isResponding
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              <ArrowUp className="h-5 w-5 text-white" />
            </Button>
          </div>
        </Card>
      </Card>
    </div>
  );
}
