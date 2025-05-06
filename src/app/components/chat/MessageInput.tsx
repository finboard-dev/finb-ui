"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { useChatStream } from "@/hooks/useChatStreaming"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { setSelectedAssistantId } from "@/lib/store/slices/chatSlice"

import type { Tool } from "@/types/chat"

// Also define the payload specific type if it's not used elsewhere
type ToolMentionType = {
    id: string
    name: string
    description: string
    category: string
    startPos: number
    endPos: number
}

// --- Local state type for mentions ---
type MentionType = {
    id: string
    name: string
    description: string
    category: string
    startPos: number
    endPos: number
}

type MessageInputProps = {
    placeholder?: string
    showBorder?: boolean
    className?: string
}

// Import selectors from the company slice
import {
    selectCurrentCompany,
    selectAllCompanyAssistants,
    selectAllCompanyTools,
} from "@/lib/store/slices/companySlice"

export default function MessageInput({
                                         placeholder = "Ask about your financial data...",
                                         showBorder = true,
                                         className = "",
                                     }: MessageInputProps) {
    // Constants
    const placeholderText = "Ask about your financial data... e.g., Revenue for last quarter"
    const MENTION_DROPDOWN_WIDTH = 288 // approx w-72 in tailwind

    const dispatch = useAppDispatch()

    // --- State ---
    const [inputValue, setInputValue] = useState("")
    const [mentions, setMentions] = useState<MentionType[]>([])
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState("")
    const [mentionStartPos, setMentionStartPos] = useState(0)
    const [cursorPosition, setCursorPosition] = useState(0)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const [activeIndex, setActiveIndex] = useState(0)
    const [isComposing, setIsComposing] = useState(false)

    // --- App state ---
    const currentCompany = useAppSelector(selectCurrentCompany)
    const availableAssistants = useAppSelector(selectAllCompanyAssistants)
    const allAvailableTools = useAppSelector(selectAllCompanyTools)

    const activeChatId = useAppSelector((state) => state.chat.activeChatId)
    const activeChat = useAppSelector((state) => state.chat.chats.find((chat) => chat.id === activeChatId))
    const isResponding = activeChat?.chats[0]?.isResponding || false

    // Get the selected assistant ID from the Redux store for the current chat
    const selectedAssistantId = activeChat?.chats[0]?.selectedAssistantId || ""

    // --- References ---
    const inputRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const { sendMessage } = useChatStream()

    // --- Initialize selectedAssistantId when assistants load ---
    useEffect(() => {
        if (activeChatId && (!selectedAssistantId || selectedAssistantId === "") && availableAssistants.length > 0) {
            // Find 'report_agent' or default to the first assistant
            const reportAgent = availableAssistants.find((assist) => assist.name === "report_agent")
            const assistantToSelect = reportAgent?.id || availableAssistants[0].id

            // Dispatch action to update the Redux store with the selected assistant for this chat
            dispatch(
                setSelectedAssistantId({
                    chatId: activeChatId,
                    assistantId: assistantToSelect,
                }),
            )
        }
    }, [availableAssistants, selectedAssistantId, activeChatId, dispatch])

    // --- Get category icons mapping ---
    const getCategoryIcon = useCallback((category: string): string => {
        const categoryIcons: Record<string, string> = {
            "Financial Reports": "📊",
            "Customer Reports": "👥",
            "Vendor Reports": "🏢",
            "Sales Reports": "💰",
            "Expense Reports": "💸",
            "Inventory Reports": "📦",
        }
        return categoryIcons[category] || "📄" // Default icon
    }, [])

    // --- Filter tools based on selected assistant ---
    const selectedAssistant = availableAssistants.find((assistant) => assistant.id === selectedAssistantId)
    const availableToolsForAssistant = selectedAssistant?.tools || []

    // --- Filter tools based on search term (using only tools from selected assistant) ---
    const filteredTools = availableToolsForAssistant.filter(
        (tool: Tool) =>
            tool.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
            tool.category.toLowerCase().includes(mentionFilter.toLowerCase()),
    )

    // --- Check if company is selected ---
    const validSelectedCompany = !!(currentCompany && currentCompany.name)

    // --- Handle click outside to close mention suggestions ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowMentionSuggestions(false)
                setMentionFilter("")
                setActiveIndex(0)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // --- Scroll active mention item into view ---
    useEffect(() => {
        if (
            showMentionSuggestions &&
            menuRef.current &&
            filteredTools.length > 0 &&
            activeIndex >= 0 &&
            activeIndex < filteredTools.length
        ) {
            const listElement = menuRef.current.querySelector('[role="listbox"]')
            if (listElement && activeIndex < listElement.children.length) {
                const activeElement = listElement.children[activeIndex] as HTMLElement | null
                if (activeElement) {
                    activeElement.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                    })
                }
            } else {
                setActiveIndex(0)
            }
        }
    }, [activeIndex, showMentionSuggestions, filteredTools.length])

    // --- Update cursor position and check for mentions ---
    const updateCursorPositionAndMentions = useCallback(() => {
        if (!inputRef.current) return

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)

        if (!inputRef.current.contains(range.commonAncestorContainer)) {
            if (showMentionSuggestions && !(menuRef.current && menuRef.current.contains(document.activeElement))) {
                setShowMentionSuggestions(false)
                setMentionFilter("")
            }
            return
        }

        const preCaretRange = document.createRange()
        preCaretRange.selectNodeContents(inputRef.current)
        preCaretRange.setEnd(range.startContainer, range.startOffset)
        const currentPosition = preCaretRange.toString().length
        setCursorPosition(currentPosition)

        const text = inputRef.current.textContent || ""

        let mentionTriggerPos = -1
        let potentialFilter = ""

        for (let i = currentPosition - 1; i >= 0; i--) {
            const char = text[i]

            let nodeAtPos: Node | null = null
            try {
                const tempRange = document.createRange()
                tempRange.setStart(range.startContainer, i)
                nodeAtPos = tempRange.startContainer
            } catch (e) {
                // Handle potential errors
            }

            let isInsideMentionSpan = false
            if (nodeAtPos) {
                let parent: Node | null = nodeAtPos
                while (parent && parent !== inputRef.current) {
                    if (
                        (parent as HTMLElement).isContentEditable === false &&
                        (parent as HTMLElement).hasAttribute("data-mention-id")
                    ) {
                        isInsideMentionSpan = true
                        break
                    }
                    parent = parent.parentNode
                }
            }

            if (/\s/.test(char)) {
                break
            } else if (char === "@") {
                if (!isInsideMentionSpan) {
                    mentionTriggerPos = i
                    potentialFilter = text.substring(i + 1, currentPosition)
                    break
                }
            }
            if (isInsideMentionSpan) {
                continue
            }
        }

        if (mentionTriggerPos !== -1) {
            setMentionFilter(potentialFilter)
            setMentionStartPos(mentionTriggerPos)
            setShowMentionSuggestions(true)

            setActiveIndex(0)

            if (inputRef.current) {
                try {
                    const cursorRect = range.getBoundingClientRect()
                    const inputRect = inputRef.current.getBoundingClientRect()

                    const topPos = cursorRect.bottom - inputRect.top + 5
                    let leftPos = cursorRect.left - inputRect.left

                    leftPos = Math.min(leftPos, inputRef.current.clientWidth - MENTION_DROPDOWN_WIDTH - 5)
                    leftPos = Math.max(5, leftPos)

                    setMenuPosition({ top: topPos, left: leftPos })
                } catch (e) {
                    console.error("Error calculating menu position:", e)
                    setMenuPosition({ top: 30, left: 10 })
                }
            }
        } else {
            setShowMentionSuggestions(false)
            setMentionFilter("")
        }
    }, [showMentionSuggestions])

    // --- Handle input changes ---
    const handleInputChange = useCallback(() => {
        if (!inputRef.current) return

        const text = inputRef.current.textContent || ""
        setInputValue(text)

        const currentMentionNodes = inputRef.current.querySelectorAll("[data-mention-id]")
        const updatedMentions: MentionType[] = []

        currentMentionNodes.forEach((node) => {
            const mentionId = node.getAttribute("data-mention-id")
            const mentionName = node.textContent?.replace(/^@/, "")

            if (mentionId && mentionName) {
                const originalTool = allAvailableTools.find((tool) => tool.id === mentionId)

                if (originalTool) {
                    const nodeIterator = document.createNodeIterator(
                        inputRef.current!,
                        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                        {
                            acceptNode: (node) => {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    return NodeFilter.FILTER_ACCEPT
                                }
                                if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute("data-mention-id")) {
                                    return NodeFilter.FILTER_ACCEPT
                                }
                                return NodeFilter.FILTER_REJECT
                            },
                        },
                    )

                    let currentNode
                    let charCount = 0
                    let foundStartPos = -1
                    let foundEndPos = -1

                    while ((currentNode = nodeIterator.nextNode())) {
                        if (currentNode === node) {
                            foundStartPos = charCount
                            foundEndPos = charCount + (node.textContent?.length || 0)
                            break
                        }
                        if (currentNode.nodeType === Node.TEXT_NODE) {
                            charCount += currentNode.textContent?.length || 0
                        } else if (
                            currentNode.nodeType === Node.ELEMENT_NODE &&
                            (currentNode as HTMLElement).hasAttribute("data-mention-id")
                        ) {
                            charCount += currentNode.textContent?.length || 0
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
                        })
                    }
                }
            }
        })

        if (JSON.stringify(updatedMentions) !== JSON.stringify(mentions)) {
            setMentions(updatedMentions)
        }

        if (!isComposing) {
            updateCursorPositionAndMentions()
        }
    }, [mentions, isComposing, allAvailableTools, updateCursorPositionAndMentions])

    // --- Handle selecting a tool from dropdown ---
    const handleSelectTool = (tool: Tool) => {
        if (!inputRef.current) return
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return
        const range = selection.getRangeAt(0)

        if (!inputRef.current.contains(range.commonAncestorContainer)) {
            console.error("Selection not in input field during tool selection.")
            setShowMentionSuggestions(false)
            return
        }

        const mentionSpan = document.createElement("span")
        mentionSpan.className =
            "inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm cursor-default"
        mentionSpan.setAttribute("data-mention-id", tool.id)
        mentionSpan.setAttribute("contenteditable", "false")
        mentionSpan.textContent = `@${tool.name}`

        const spaceNode = document.createTextNode("\u00A0")

        const replacementRange = document.createRange()
        try {
            let startNode: Node | null = null
            let startOffset = 0
            let charCount = 0
            const nodeIterator = document.createNodeIterator(inputRef.current, NodeFilter.SHOW_TEXT)
            let currentNode
            while ((currentNode = nodeIterator.nextNode())) {
                const nodeLength = currentNode.textContent?.length || 0
                if (mentionStartPos >= charCount && mentionStartPos < charCount + nodeLength) {
                    startNode = currentNode
                    startOffset = mentionStartPos - charCount
                    break
                }
                charCount += nodeLength
            }

            if (!startNode) {
                console.error("Could not find text node for mention start position.")
                const filterLength = cursorPosition - mentionStartPos
                replacementRange.setStart(range.startContainer, Math.max(0, range.startOffset - filterLength))
                replacementRange.setEnd(range.endContainer, range.endOffset)
            } else {
                replacementRange.setStart(startNode, startOffset)
                replacementRange.setEnd(range.startContainer, range.startOffset)
            }

            replacementRange.deleteContents()

            replacementRange.insertNode(spaceNode)
            replacementRange.insertNode(mentionSpan)

            selection.removeAllRanges()
            const newRange = document.createRange()
            newRange.setStartAfter(spaceNode)
            newRange.collapse(true)
            selection.addRange(newRange)
        } catch (e) {
            console.error("Error inserting mention span:", e)
            try {
                range.deleteContents()
                range.insertNode(spaceNode)
                range.insertNode(mentionSpan)
                range.setStartAfter(spaceNode)
                range.collapse(true)
                selection.removeAllRanges()
                selection.addRange(range)
            } catch (fallbackError) {
                console.error("Error during fallback insertion:", fallbackError)
            }
        }

        setShowMentionSuggestions(false)
        setMentionFilter("")

        setTimeout(() => {
            handleInputChange()
            if (inputRef.current) {
                inputRef.current.focus()
                const newSelection = window.getSelection()
                if (newSelection && newSelection.rangeCount > 0) {
                    const newRange = newSelection.getRangeAt(0)
                    const preCaretRange = document.createRange()
                    preCaretRange.selectNodeContents(inputRef.current!)
                    preCaretRange.setEnd(newRange.startContainer, newRange.startOffset)
                    setCursorPosition(preCaretRange.toString().length)
                }
            }
        }, 0)
    }

    // --- Handle key events ---
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isComposing) return

        if (showMentionSuggestions && filteredTools.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setActiveIndex((prevIndex) => (prevIndex + 1) % filteredTools.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActiveIndex((prevIndex) => (prevIndex - 1 + filteredTools.length) % filteredTools.length)
            } else if (e.key === "Enter" || e.key === "Tab") {
                if (activeIndex >= 0 && activeIndex < filteredTools.length) {
                    e.preventDefault()
                    handleSelectTool(filteredTools[activeIndex])
                } else if (e.key === "Enter") {
                    e.preventDefault()
                    setShowMentionSuggestions(false)
                    setMentionFilter("")
                }
            } else if (e.key === "Escape") {
                e.preventDefault()
                setShowMentionSuggestions(false)
                setMentionFilter("")
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    // --- Extract mentions for payload ---
    const extractMentionsForPayload = (): ToolMentionType[] => {
        return mentions.map((mention) => ({
            id: mention.id,
            name: mention.name,
            description: mention.description,
            category: mention.category,
            startPos: mention.startPos,
            endPos: mention.endPos,
        }))
    }

    const handleSubmit = () => {
        if (!inputRef.current || isResponding || !activeChatId || !validSelectedCompany || !selectedAssistantId) {
            console.warn("Cannot submit: input empty, responding, no chat, no company, or no model selected.")
            return
        }
        const plainText = inputRef.current.textContent?.trim() || ""
        if (!plainText) return
        const extractedMentions: ToolMentionType[] = extractMentionsForPayload()

        const selectedAssistant = availableAssistants.find((assistant) => assistant.id === selectedAssistantId)
        const modelObject = selectedAssistant
            ? {
                id: selectedAssistant.id,
                name: selectedAssistant.name,
            }
            : undefined
        const messagePayload = {
            text: plainText,
            ...(extractedMentions.length > 0 && { mentions: extractedMentions }),
            ...(modelObject && { model: modelObject }),
        }

        inputRef.current.innerHTML = ""
        setInputValue("")
        setMentions([])
        setShowMentionSuggestions(false)

        sendMessage.mutate(messagePayload)
    }

    // Handle assistant selection change
    const handleAssistantChange = (assistantId: string) => {
        if (activeChatId) {
            dispatch(
                setSelectedAssistantId({
                    chatId: activeChatId,
                    assistantId,
                }),
            )
        }
    }

    useEffect(() => {
        handleInputChange()
    }, [inputRef.current, mentions.length, handleInputChange])

    useEffect(() => {
        const handlePlaceholder = () => {
            if (!inputRef.current) return
            const isEmpty = !inputRef.current.textContent?.trim()
            if (isEmpty) {
                inputRef.current.setAttribute("data-empty", "true")
            } else {
                inputRef.current.removeAttribute("data-empty")
            }
        }

        handlePlaceholder()

        const observer = new MutationObserver(handlePlaceholder)
        if (inputRef.current) {
            observer.observe(inputRef.current, {
                childList: true,
                characterData: true,
                subtree: true,
            })
        }

        return () => observer.disconnect()
    }, [])

    return (
        // Outer container for spacing
        <div className={`${className} w-full max-w-4xl mx-auto px-4 pb-4 pt-2`}>
            {/* Card for overall structure, border shown/hidden based on prop */}
            <Card
                className={`${
                    !showBorder
                        ? "bg-transparent px-0 py-0 border-none shadow-none"
                        : "rounded-2xl bg-background-card border-none px-3 py-3" // Adjusted padding
                } transition-all duration-200`}
            >
                {/* Inner card - restored original padding and border */}
                {/* Adjusted padding here as well */}
                <Card className="rounded-xl bg-white border border-primary p-4 relative">
                    {" "}
                    {/* Reduced inner padding slightly */}
                    {/* Container for the input field itself */}
                    <div className="relative" ref={containerRef}>
                        <div
                            ref={inputRef}
                            contentEditable={!isResponding && validSelectedCompany && !!activeChatId}
                            onInput={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onKeyUp={updateCursorPositionAndMentions} // Use keyup to capture cursor position after key press
                            onClick={updateCursorPositionAndMentions} // Update position on click
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => {
                                setIsComposing(false)
                                // Need to re-process input after composition finishes
                                handleInputChange()
                                updateCursorPositionAndMentions()
                            }}
                            onFocus={updateCursorPositionAndMentions} // Update position on focus
                            className={`
  ${showBorder ? "min-h-[40px]" : "min-h-[48px]"}
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
                            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} // Preserve line breaks and wrap words
                        />

                        {/* Mention suggestions dropdown */}
                        {showMentionSuggestions && (
                            <div
                                ref={menuRef}
                                className="absolute z-50 mt-1 w-72 max-h-[250px] overflow-y-auto rounded-lg shadow-xl bg-white" // Removed border
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
                                                <div className="font-medium text-xs">No tools found</div>
                                                {selectedAssistant && selectedAssistant.tools.length === 0 ? (
                                                    <div className="text-xs text-gray-400 mt-0.5">This assistant has no available tools</div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 mt-0.5">Try searching for a different tool</div>
                                                )}
                                            </div>
                                        </CommandEmpty>
                                        {filteredTools.length > 0 && (
                                            <CommandGroup heading="Tools" className="px-1">
                                                {filteredTools.map((tool, index) => (
                                                    <CommandItem
                                                        key={tool.id}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            handleSelectTool(tool)
                                                        }}
                                                        onMouseEnter={() => setActiveIndex(index)}
                                                        className={`px-3 py-2 cursor-pointer flex items-center gap-3 rounded-md ${index === activeIndex ? "bg-blue-50" : ""}`}
                                                        value={tool.name}
                                                    >
                                                        <div
                                                            className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-lg ${
                                                                index === activeIndex ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                                            }`}
                                                        >
                                                            {getCategoryIcon(tool.category)}
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                              <span
                                  className={`text-sm font-medium truncate ${
                                      index === activeIndex ? "text-blue-800" : "text-gray-800"
                                  }`}
                              >
                                {tool.name}
                              </span>
                                                            <span className="text-xs text-gray-500 mt-0.5 truncate">{tool.category}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </div>
                        )}
                    </div>{" "}
                    {/* End relative container */}
                    {/* Bottom Bar */}
                    <div className="flex items-center mt-3 gap-3">
                        {" "}
                        {/* Removed pt-3 and border-t */}
                        {/* Selected Company */}
                        <div className="relative">
                            <div
                                className={`flex items-center border ${!currentCompany?.name ? "border-dashed border-gray-300 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-700"} rounded-lg px-2.5 py-1.5 cursor-default text-sm h-9`} // Added h-9 for consistent height
                            >
                                {!currentCompany?.name ? (
                                    <span>Connect company</span>
                                ) : (
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 16 16"
                                            fill="currentColor"
                                            className="w-3.5 h-3.5 text-gray-500"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M2.75 2A.75.75 0 0 0 2 2.75v10.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V2.75a.75.75 0 0 0-.75-.75H2.75ZM3.5 4a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4ZM10 8.75a.75.75 0 0 1-.75.75h-4a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .75.75ZM7.5 7a.75.75 0 0 0 0-1.5h-4a.75.75 0 0 0 0 1.5h4Z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-gray-700"> {currentCompany.name} </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Assistant Selector (labeled Model) */}
                        <div className="relative">
                            <Select
                                value={selectedAssistantId}
                                onValueChange={handleAssistantChange}
                                disabled={!validSelectedCompany || availableAssistants.length === 0}
                            >
                                <SelectTrigger className="h-9 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-300 focus:border-blue-300 data-[disabled]:opacity-50 bg-gray-50 text-gray-700">
                                    {" "}
                                    {/* Added h-9 for consistent height */}
                                    <div className="flex items-center gap-1.5">
                                        {/* Icon representative of a model/AI */}
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
                                            <rect width="8" height="4" x="8" y="2h8a2 2 0 0 1 2 2v2" />
                                            <circle cx="12" cy="17" r="3" />
                                            <path d="M12 14v7" />
                                            <path d="M12 17h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                                            <path d="M12 17h-8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
                                        </svg>

                                        <SelectValue placeholder="Select AI model..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-none shadow-xl p-1">
                                    {availableAssistants.map((assistant) => (
                                        <SelectItem key={assistant.id} value={assistant.id} className="text-sm cursor-pointer">
                                            {" "}
                                            {assistant.name}{" "}
                                        </SelectItem>
                                    ))}
                                    {availableAssistants.length === 0 && (
                                        <div className="p-2 text-center text-gray-500 text-sm">No AI models available</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Spacer */}
                        <div className="flex-grow"></div>
                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            id="send-chat-input-button"
                            // Disable if input is empty, responding, no chat, no company, or no assistant selected
                            disabled={
                                !inputValue.trim() || isResponding || !activeChatId || !validSelectedCompany || !selectedAssistantId
                            }
                            className={`rounded-full h-9 w-9 p-0 flex items-center justify-center transition-colors duration-200 ${
                                !inputValue.trim() || isResponding || !activeChatId || !validSelectedCompany || !selectedAssistantId
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" // Lighter disabled style
                                    : "bg-blue-600 hover:bg-blue-700 text-white" // Primary send button color
                            }`}
                            aria-label="Send message"
                        >
                            <ArrowUp className="h-4 w-4" /> {/* Slightly smaller icon */}
                        </Button>
                    </div>
                    {/* Hint */}
                    {!showBorder && (
                        <div className="text-xs text-gray-400 mt-2 px-1 text-left">
                            {" "}
                            Type <span className="font-medium bg-gray-100 px-1 rounded">@</span> to mention a report tool{" "}
                        </div>
                    )}
                </Card>{" "}
                {/* End Inner card */}
            </Card>{" "}
            {/* End Outer card */}
        </div> // End Outer container
    )
}
