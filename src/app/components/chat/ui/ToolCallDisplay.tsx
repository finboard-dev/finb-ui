"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { setResponsePanelWidth } from "@/lib/store/slices/chatSlice"
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice"
import { Loader2, Code, BarChart2, Table, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolCallProps {
    toolCall: {
        name?: string
        args?: any
        id?: string
        position?: number
    } | undefined
    isLoading?: boolean
    messageId: string
    inline?: boolean
}

const ToolCallDisplay = ({ toolCall, isLoading = false, messageId, inline = false }: ToolCallProps) => {
    const dispatch = useAppDispatch()
    const { toolCallResponses } = useAppSelector((state) => state.responsePanel)
    const [isExpanded, setIsExpanded] = useState(false)
    const response = toolCallResponses.find((resp) => resp?.tool_call_id === toolCall?.id)
    const isToolCompleted = !!response
    const isProcessing = isLoading && !isToolCompleted

    if (!toolCall) {
        return (
            <div className={cn("my-2 transition-all duration-200", inline ? "mx-2" : "mx-0")}>
                <div className="rounded-lg border border-red-200 bg-red-50 shadow-sm p-3">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Tool call reference not found</span>
                    </div>
                </div>
            </div>
        )
    }

    const handleOpenPanel = (toolCallId: string) => {
        dispatch(setActiveToolCallId(toolCallId))
        dispatch(setResponsePanelWidth(500))
        const event = new CustomEvent("toolCallSelected", {
            detail: { toolCallId, messageId },
        })
        window.dispatchEvent(event)
    }

    const getToolIcon = (toolName: string | undefined) => {
        if (!toolName) {
            return <Code className="w-4 h-4" />
        }

        const toolType = toolName.toLowerCase()
        if (toolType.includes("graph") || toolType.includes("chart") || toolType.includes("visualization")) {
            return <BarChart2 className="w-4 h-4" />
        } else if (toolType.includes("table") || toolType.includes("sheet") || toolType.includes("data")) {
            return <Table className="w-4 h-4" />
        } else {
            return <Code className="w-4 h-4" />
        }
    }

    const formatToolName = (name: string | undefined) => {
        if (!name) return "Tool Call"

        const simpleName = name.split("/").pop() || name
        return simpleName
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^\$w/, (c) => c.toUpperCase())
    }

    const renderArgs = () => {
        if (!toolCall?.args || Object.keys(toolCall.args).length === 0) {
            return <span className="text-gray-500">No arguments provided</span>
        }

        try {
            return (
                <div className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-96">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(toolCall.args, null, 2)}</pre>
                </div>
            )
        } catch (error) {
            return <span className="text-gray-500">Unable to parse arguments</span>
        }
    }

    const renderError = () => {
        if (response?.type === "error") {
            return (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle className="w-5 h-5" />
                    <span>{response.data || "An error occurred while processing this tool call."}</span>
                </div>
            )
        }
        return null
    }

    const getBorderColor = () => {
        if (isProcessing) return "border-blue-200"
        if (response?.type === "error") return "border-red-200"
        if (isToolCompleted) return "border-green-200"
        return "border-gray-200"
    }

    const getHeaderBgColor = () => {
        if (isProcessing) return "bg-blue-50"
        if (response?.type === "error") return "bg-red-50"
        if (isToolCompleted) return "bg-green-50"
        return "bg-gray-50"
    }

    return (
        <div className={cn("my-2 transition-all duration-200", inline ? "mx-2" : "mx-0")}>
            <div className={`rounded-lg border ${getBorderColor()} bg-white shadow-sm hover:shadow-md transition-shadow`}>
                <div
                    className={`flex items-center justify-between p-3 cursor-pointer ${getHeaderBgColor()} rounded-t-lg hover:bg-opacity-80 transition-colors`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        {getToolIcon(toolCall?.name)}
                        <span className="font-medium text-gray-800">{formatToolName(toolCall?.name)}</span>
                        {isProcessing && <span className="text-xs text-blue-600 font-medium">Processing...</span>}
                        {isToolCompleted && response?.type !== "error" && <span className="text-xs text-green-600 font-medium">Completed</span>}
                        {response?.type === "error" && <span className="text-xs text-red-600 font-medium">Error</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Arguments</h4>
                            {renderArgs()}
                        </div>

                        {renderError()}

                        {isToolCompleted && response?.type !== "error" && toolCall?.id && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPanel(toolCall.id as string)}
                                className="w-full h-9 text-sm"
                            >
                                View Results
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ToolCallDisplay