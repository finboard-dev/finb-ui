"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { ArrowUp } from "lucide-react"
import ArrowUp from "@/../public/images/icons/arrow_up.svg";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useChatStream } from "@/hooks/useChatStreaming";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  setSelectedAssistantId,
  initializeNewChat,
} from "@/lib/store/slices/chatSlice";

import type { Tool } from "@/types/chat";

import { selectSelectedCompany } from "@/lib/store/slices/userSlice";
import Image from "next/image";
import { Company } from "@/lib/store/slices/userSlice";
import { useUrlParams } from "@/lib/utils/urlParams";

export type MessageInputProps = {
  placeholder?: string;
  showBorder?: boolean;
  className?: string;
};

export type MentionType = {
  id: string;
  name: string;
  description: string;
  category: string;
  startPos: number;
  endPos: number;
};

export type ToolMentionType = MentionType;

export default function MessageInput({
  placeholder = "Ask about your financial data...",
  showBorder = true,
  className = "",
}: MessageInputProps) {
  const placeholderText = `Type @${String.fromCharCode(
    8203
  )} to mention a report tool`;
  const MENTION_DROPDOWN_WIDTH = 288;

  const dispatch = useAppDispatch();
  const { startNewChat } = useUrlParams();

  const [inputValue, setInputValue] = useState("");
  const [mentions, setMentions] = useState<MentionType[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  const selectedCompany = useAppSelector(selectSelectedCompany) as Company & {
    assistants?: any[];
    name?: string;
  };

  console.log(selectedCompany);

  const availableAssistants: any[] = selectedCompany?.assistants || [];
  const allAvailableTools = availableAssistants.flatMap(
    (a: any) => a.tools || []
  );

  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const activeChat = useAppSelector((state) => {
    // Check if the active chat is the pending chat
    if (
      state.chat.pendingChat &&
      state.chat.pendingChat.id === state.chat.activeChatId
    ) {
      return state.chat.pendingChat;
    }
    // Otherwise find it in the regular chats
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
  });

  const isResponding = activeChat?.chats[0]?.isResponding || false;
  const selectedAssistantId = activeChat?.chats[0]?.selectedAssistantId || "";
  const hasMessages =
    activeChat?.chats[0]?.messages?.some((msg) => msg.role === "user") || false;

  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCreatingNewChatRef = useRef(false);

  const { sendMessage } = useChatStream();

  // Set default assistant when component mounts
  useEffect(() => {
    if (
      activeChatId &&
      !selectedAssistantId &&
      availableAssistants.length > 0
    ) {
      const defaultAssistant =
        availableAssistants.find((assist) => assist.name === "report_agent") ||
        availableAssistants[0];

      if (defaultAssistant) {
        dispatch(
          setSelectedAssistantId({
            chatId: activeChatId,
            assistantId: defaultAssistant.id,
          })
        );
      }
    }
  }, [activeChatId, selectedAssistantId, availableAssistants, dispatch]);

  const getCategoryIcon = useCallback((category: string): string => {
    const categoryIcons: Record<string, string> = {
      "Financial Reports": "📊",
      "Customer Reports": "👥",
      "Vendor Reports": "🏢",
      "Sales Reports": "💰",
      "Expense Reports": "💸",
      "Inventory Reports": "📦",
    };
    return categoryIcons[category] || "📄";
  }, []);

  const selectedAssistant = availableAssistants.find(
    (assistant) => assistant.id === selectedAssistantId
  );
  const availableToolsForAssistant = selectedAssistant?.tools || [];

  const filteredTools = availableToolsForAssistant.filter(
    (tool: Tool) =>
      tool.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
      tool.category.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const validSelectedCompany = !!(selectedCompany && selectedCompany.name);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowMentionSuggestions(false);
        setMentionFilter("");
        setActiveIndex(0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      showMentionSuggestions &&
      menuRef.current &&
      filteredTools.length > 0 &&
      activeIndex >= 0 &&
      activeIndex < filteredTools.length
    ) {
      const listElement = menuRef.current.querySelector('[role="listbox"]');
      if (listElement && activeIndex < listElement.children.length) {
        const activeElement = listElement.children[
          activeIndex
        ] as HTMLElement | null;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      } else {
        setActiveIndex(0);
      }
    }
  }, [activeIndex, showMentionSuggestions, filteredTools.length]);

  const updateCursorPositionAndMentions = useCallback(() => {
    if (!inputRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (!inputRef.current.contains(range.commonAncestorContainer)) {
      if (
        showMentionSuggestions &&
        !(menuRef.current && menuRef.current.contains(document.activeElement))
      ) {
        setShowMentionSuggestions(false);
        setMentionFilter("");
      }
      return;
    }

    const preCaretRange = document.createRange();
    preCaretRange.selectNodeContents(inputRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const currentPosition = preCaretRange.toString().length;
    setCursorPosition(currentPosition);

    const text = inputRef.current.textContent || "";

    let mentionTriggerPos = -1;
    let potentialFilter = "";

    for (let i = currentPosition - 1; i >= 0; i--) {
      const char = text[i];

      let nodeAtPos: Node | null = null;
      try {
        const tempRange = document.createRange();
        tempRange.setStart(range.startContainer, i);
        nodeAtPos = tempRange.startContainer;
      } catch (e) {}

      let isInsideMentionSpan = false;
      if (nodeAtPos) {
        let parent: Node | null = nodeAtPos;
        while (parent && parent !== inputRef.current) {
          if (
            (parent as HTMLElement).isContentEditable === false &&
            (parent as HTMLElement).hasAttribute("data-mention-id")
          ) {
            isInsideMentionSpan = true;
            break;
          }
          parent = parent.parentNode;
        }
      }

      if (/\s/.test(char)) {
        break;
      } else if (char === "@") {
        if (!isInsideMentionSpan) {
          mentionTriggerPos = i;
          potentialFilter = text.substring(i + 1, currentPosition);
          break;
        }
      }
      if (isInsideMentionSpan) {
        continue;
      }
    }

    if (mentionTriggerPos !== -1) {
      setMentionFilter(potentialFilter);
      setMentionStartPos(mentionTriggerPos);
      setShowMentionSuggestions(true);

      setActiveIndex(0);

      if (inputRef.current) {
        try {
          const cursorRect = range.getBoundingClientRect();
          const inputRect = inputRef.current.getBoundingClientRect();

          const topPos = cursorRect.bottom - inputRect.top + 5;
          let leftPos = cursorRect.left - inputRect.left;

          leftPos = Math.min(
            leftPos,
            inputRef.current.clientWidth - MENTION_DROPDOWN_WIDTH - 5
          );
          leftPos = Math.max(5, leftPos);

          setMenuPosition({ top: topPos, left: leftPos });
        } catch (e) {
          console.error("Error calculating menu position:", e);
          setMenuPosition({ top: 30, left: 10 });
        }
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionFilter("");
    }
  }, [showMentionSuggestions]);

  const handleInputChange = useCallback(() => {
    if (!inputRef.current) return;

    const text = inputRef.current.textContent || "";
    setInputValue(text);

    const currentMentionNodes =
      inputRef.current.querySelectorAll("[data-mention-id]");
    const updatedMentions: MentionType[] = [];

    currentMentionNodes.forEach((node) => {
      const mentionId = node.getAttribute("data-mention-id");
      const mentionName = node.textContent?.replace(/^@/, "");

      if (mentionId && mentionName) {
        const originalTool = allAvailableTools.find(
          (tool: Tool) => tool.id === mentionId
        );

        if (originalTool) {
          const nodeIterator = document.createNodeIterator(
            inputRef.current!,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                if (
                  node.nodeType === Node.ELEMENT_NODE &&
                  (node as HTMLElement).hasAttribute("data-mention-id")
                ) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              },
            }
          );

          let currentNode;
          let charCount = 0;
          let foundStartPos = -1;
          let foundEndPos = -1;

          while ((currentNode = nodeIterator.nextNode())) {
            if (currentNode === node) {
              foundStartPos = charCount;
              foundEndPos = charCount + (node.textContent?.length || 0);
              break;
            }
            if (currentNode.nodeType === Node.TEXT_NODE) {
              charCount += currentNode.textContent?.length || 0;
            } else if (
              currentNode.nodeType === Node.ELEMENT_NODE &&
              (currentNode as HTMLElement).hasAttribute("data-mention-id")
            ) {
              charCount += currentNode.textContent?.length || 0;
            }
          }

          if (foundStartPos !== -1 && foundEndPos !== -1) {
            updatedMentions.push({
              id: originalTool.id,
              name: originalTool.name,
              description: originalTool.description,
              category: originalTool.category,
              startPos: foundStartPos,
              endPos: foundEndPos,
            });
          }
        }
      }
    });

    if (JSON.stringify(updatedMentions) !== JSON.stringify(mentions)) {
      setMentions(updatedMentions);
    }

    if (!isComposing) {
      updateCursorPositionAndMentions();
    }
  }, [
    mentions,
    isComposing,
    allAvailableTools,
    updateCursorPositionAndMentions,
  ]);

  const handleSelectTool = (tool: Tool) => {
    if (!inputRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (!inputRef.current.contains(range.commonAncestorContainer)) {
      console.error("Selection not in input field during tool selection.");
      setShowMentionSuggestions(false);
      return;
    }

    const mentionSpan = document.createElement("span");
    mentionSpan.className =
      "inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm cursor-default";
    mentionSpan.setAttribute("data-mention-id", tool.id);
    mentionSpan.setAttribute("contenteditable", "false");
    mentionSpan.textContent = `@${tool.name}`;

    const spaceNode = document.createTextNode("\u00A0");

    const replacementRange = document.createRange();
    try {
      let startNode: Node | null = null;
      let startOffset = 0;
      let charCount = 0;
      const nodeIterator = document.createNodeIterator(
        inputRef.current,
        NodeFilter.SHOW_TEXT
      );
      let currentNode;
      while ((currentNode = nodeIterator.nextNode())) {
        const nodeLength = currentNode.textContent?.length || 0;
        if (
          mentionStartPos >= charCount &&
          mentionStartPos < charCount + nodeLength
        ) {
          startNode = currentNode;
          startOffset = mentionStartPos - charCount;
          break;
        }
        charCount += nodeLength;
      }

      if (!startNode) {
        console.error("Could not find text node for mention start position.");
        const filterLength = cursorPosition - mentionStartPos;
        replacementRange.setStart(
          range.startContainer,
          Math.max(0, range.startOffset - filterLength)
        );
        replacementRange.setEnd(range.endContainer, range.endOffset);
      } else {
        replacementRange.setStart(startNode, startOffset);
        replacementRange.setEnd(range.startContainer, range.startOffset);
      }

      replacementRange.deleteContents();

      replacementRange.insertNode(spaceNode);
      replacementRange.insertNode(mentionSpan);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      selection.addRange(newRange);
    } catch (e) {
      console.error("Error inserting mention span:", e);
      try {
        range.deleteContents();
        range.insertNode(spaceNode);
        range.insertNode(mentionSpan);
        range.setStartAfter(spaceNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (fallbackError) {
        console.error("Error during fallback insertion:", fallbackError);
      }
    }

    setShowMentionSuggestions(false);
    setMentionFilter("");

    setTimeout(() => {
      handleInputChange();
      if (inputRef.current) {
        inputRef.current.focus();
        const newSelection = window.getSelection();
        if (newSelection && newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0);
          const preCaretRange = document.createRange();
          preCaretRange.selectNodeContents(inputRef.current!);
          preCaretRange.setEnd(newRange.startContainer, newRange.startOffset);
          setCursorPosition(preCaretRange.toString().length);
        }
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposing) return;

    if (showMentionSuggestions && filteredTools.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex + 1) % filteredTools.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (prevIndex) =>
            (prevIndex - 1 + filteredTools.length) % filteredTools.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (activeIndex >= 0 && activeIndex < filteredTools.length) {
          e.preventDefault();
          handleSelectTool(filteredTools[activeIndex]);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setShowMentionSuggestions(false);
          setMentionFilter("");
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionSuggestions(false);
        setMentionFilter("");
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const extractMentionsForPayload = (): ToolMentionType[] => {
    return mentions.map((mention) => ({
      id: mention.id,
      name: mention.name,
      description: mention.description,
      category: mention.category,
      startPos: mention.startPos,
      endPos: mention.endPos,
    }));
  };

  const handleSubmit = () => {
    if (
      !inputRef.current ||
      isResponding ||
      !activeChatId ||
      !validSelectedCompany ||
      !selectedAssistantId
    ) {
      console.warn(
        "Cannot submit: input empty, responding, no chat, no company, or no model selected."
      );
      return;
    }
    const plainText = inputRef.current.textContent?.trim() || "";
    if (!plainText) return;
    const extractedMentions: ToolMentionType[] = extractMentionsForPayload();

    const selectedAssistant = availableAssistants.find(
      (assistant) => assistant.id === selectedAssistantId
    );
    const modelObject = selectedAssistant
      ? {
          id: selectedAssistant.id,
          name: selectedAssistant.name,
        }
      : undefined;
    const messagePayload = {
      text: plainText,
      ...(extractedMentions.length > 0 && { mentions: extractedMentions }),
      ...(modelObject && { model: modelObject }),
    };

    inputRef.current.innerHTML = "";
    setInputValue("");
    setMentions([]);
    setShowMentionSuggestions(false);

    sendMessage.mutate(messagePayload);
  };

  const handleAssistantChange = (assistantId: string) => {
    // Prevent infinite loop by checking if the assistant is already selected
    if (selectedAssistantId === assistantId || isCreatingNewChatRef.current) {
      return;
    }

    // If the chat already has messages, create a new chat with the selected assistant
    if (hasMessages) {
      isCreatingNewChatRef.current = true;
      dispatch(initializeNewChat({ assistantId }));
      // Add a small delay to ensure Redux state is properly updated before URL change
      setTimeout(() => {
        startNewChat();
        // Reset the flag after a delay to allow future changes
        setTimeout(() => {
          isCreatingNewChatRef.current = false;
        }, 100);
      }, 0);
    } else {
      // Otherwise, just update the assistant for the current chat
      if (activeChatId) {
        dispatch(
          setSelectedAssistantId({
            chatId: activeChatId,
            assistantId,
          })
        );
      }
    }
  };

  useEffect(() => {
    handleInputChange();
  }, [inputRef.current, mentions.length, handleInputChange]);

  useEffect(() => {
    const handlePlaceholder = () => {
      if (!inputRef.current) return;
      const isEmpty = !inputRef.current.textContent?.trim();
      if (isEmpty) {
        inputRef.current.setAttribute("data-empty", "true");
      } else {
        inputRef.current.removeAttribute("data-empty");
      }
    };

    handlePlaceholder();

    const observer = new MutationObserver(handlePlaceholder);
    if (inputRef.current) {
      observer.observe(inputRef.current, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${className} w-full max-w-4xl mx-auto px-4 pb-4 pt-2`}>
      <Card
        className={`${
          !showBorder
            ? "bg-transparent px-0 py-0 border-none shadow-none"
            : "rounded-2xl bg-[#F8F8F8] border-none px-3 py-3"
        } transition-all duration-200`}
      >
        <Card className="rounded-xl bg-white border-[1px] stroke-100 shadow-none p-4 relative">
          <div className="relative" ref={containerRef}>
            <div
              ref={inputRef}
              contentEditable={
                !isResponding && validSelectedCompany && !!activeChatId
              }
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorPositionAndMentions}
              onClick={updateCursorPositionAndMentions}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => {
                setIsComposing(false);
                handleInputChange();
                updateCursorPositionAndMentions();
              }}
              onFocus={updateCursorPositionAndMentions}
              className={`
        ${showBorder ? "min-h-24" : "min-h-36"}
        px-1 py-1
        text-base text-gray-800
        focus:outline-none w-full
        relative
        overflow-y-auto max-h-[150px]
        data-[empty=true]:before:content-[attr(data-placeholder)]
        data-[empty=true]:before:absolute
        data-[empty=true]:before:text-gray-400
        data-[empty=true]:before:pointer-events-none
        data-[empty=true]:before:top-1
        data-[empty=true]:before:left-1
    `}
              data-placeholder={
                !validSelectedCompany
                  ? "Please connect a company first"
                  : !activeChatId
                  ? "Please select or start a chat"
                  : isResponding
                  ? "Waiting for response..."
                  : placeholderText
              }
              suppressContentEditableWarning={true}
              role="textbox"
              aria-multiline="true"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            />
            {showMentionSuggestions && (
              <div
                ref={menuRef}
                className="absolute z-50 mt-1 w-72 max-h-[250px] overflow-y-auto rounded-lg shadow-xl bg-white"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <Command className="border-none rounded-lg">
                  <CommandInput
                    placeholder="Search report tools..."
                    value={mentionFilter}
                    onValueChange={setMentionFilter}
                    className="border-b border-gray-100 focus-visible:ring-0 focus-visible:border-blue-300 px-3 py-2 text-sm"
                  />
                  <CommandList className="p-1">
                    <CommandEmpty>
                      <div className="p-4 text-sm text-center text-gray-500 flex flex-col items-center justify-center h-24">
                        <div className="text-gray-400 text-3xl mb-1">🤷‍♀️</div>
                        <div className="font-medium text-xs">
                          No tools found
                        </div>
                        {selectedAssistant &&
                        selectedAssistant.tools.length === 0 ? (
                          <div className="text-xs text-gray-400 mt-0.5">
                            This assistant has no available tools
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Try searching for a different tool
                          </div>
                        )}
                      </div>
                    </CommandEmpty>
                    {filteredTools.length > 0 && (
                      <CommandGroup heading="Tools" className="px-1">
                        {filteredTools.map((tool: any, index: any) => (
                          <CommandItem
                            key={tool.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectTool(tool);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-3 rounded-md ${
                              index === activeIndex ? "bg-blue-50" : ""
                            }`}
                            value={tool.name}
                          >
                            <div
                              className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-lg ${
                                index === activeIndex
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {getCategoryIcon(tool.category)}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span
                                className={`text-sm font-medium truncate ${
                                  index === activeIndex
                                    ? "text-blue-800"
                                    : "text-gray-800"
                                }`}
                              >
                                {tool.name}
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5 truncate">
                                {tool.category}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          <div className="flex items-center mt-3 gap-3">
            <div className="relative">
              <div
                className={`flex items-center min-h-fit border ${
                  !selectedCompany?.name
                    ? "border-dashed border-gray-300 text-gray-400"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                } rounded-lg px-2.5 py-1.5 cursor-default text-sm h-9`}
              >
                {selectedCompany?.name ? (
                  <span>{selectedCompany.name}</span>
                ) : (
                  <span>Connect company</span>
                )}
              </div>
            </div>
            <div className="relative">
              <Select
                value={selectedAssistantId}
                onValueChange={handleAssistantChange}
                disabled={
                  !selectedCompany ||
                  availableAssistants.length === 0 ||
                  isResponding
                }
              >
                <SelectTrigger className="h-9 min-h-fit text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-300 focus:border-blue-300 data-[disabled]:opacity-50 bg-gray-50 text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-gray-500"
                    >
                      <path d="M12 8V4" />
                      <rect width="8" height="4" x="8" y="2" rx="2" />
                      <circle cx="12" cy="17" r="3" />
                      <path d="M12 14v7" />
                      <path d="M12 17h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                      <path d="M12 17h-8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
                    </svg>
                    <SelectValue placeholder="Select AI model...">
                      {selectedAssistant
                        ? selectedAssistant.displayName
                        : "Select AI model..."}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-none shadow-xl p-1">
                  {availableAssistants.map((assistant: any) => (
                    <SelectItem
                      key={assistant.id}
                      value={assistant.id}
                      className="text-sm cursor-pointer"
                    >
                      {assistant.displayName}
                    </SelectItem>
                  ))}
                  {availableAssistants.length === 0 && (
                    <div className="p-2 text-center text-gray-500 text-sm">
                      No AI models available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow"></div>
            <Button
              onClick={handleSubmit}
              id="send-chat-input-button"
              disabled={
                !inputValue.trim() ||
                isResponding ||
                !activeChatId ||
                !validSelectedCompany ||
                !selectedAssistantId
              }
              className={`rounded-full h-9 w-9 p-0 flex items-center cursor-pointer justify-center transition-colors duration-200 ${
                !inputValue.trim() ||
                isResponding ||
                !activeChatId ||
                !validSelectedCompany ||
                !selectedAssistantId
                  ? "bg-sec text-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary text-white-text"
              }`}
              aria-label="Send message"
            >
              <Image src={ArrowUp} alt={"arrow_up"} width={16} height={16} />
            </Button>
          </div>
          {/*{!showBorder && (*/}
          {/*    <div className="text-xs text-gray-400 mt-2 px-1 text-left">*/}
          {/*        Type <span className="font-medium bg-gray-100 px-1 rounded">@</span> to mention a report tool*/}
          {/*    </div>*/}
          {/*)}*/}
        </Card>
      </Card>
    </div>
  );
}
