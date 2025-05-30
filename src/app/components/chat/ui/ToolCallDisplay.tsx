"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { setResponsePanelWidth, setActiveMessageId } from "@/lib/store/slices/chatSlice"
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice"
import {
    Loader2,
    Code,
    BarChart2,
    Table,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Zap,
    Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolCallProps {
    toolCall:
        | {
        name?: string
        args?: any
        id?: string
        position?: number
    }
        | undefined
    isLoading?: boolean
    messageId: string
    inline?: boolean
}

const ToolCallDisplay = ({ toolCall, isLoading = false, messageId, inline = false }: ToolCallProps) => {
    const dispatch = useAppDispatch()
    const { toolCallResponses } = useAppSelector((state) => state.responsePanel)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const response = toolCallResponses.find((resp) => resp?.tool_call_id === toolCall?.id)
    const isToolCompleted = !!response
    const isProcessing = isLoading && !isToolCompleted
    const hasError = response?.type === "error"

    if (!toolCall || !toolCall.id) {
        return (
            <div className={cn("my-3 transition-all duration-300", inline ? "mx-2" : "mx-0")}>
                <div className="group relative overflow-hidden rounded-xl border border-red-200/50 bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5" />
                    <div className="relative flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 ring-2 ring-red-200/50">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-medium text-red-800">Tool Reference Missing</p>
                            <p className="text-sm text-red-600/80">Unable to locate tool call information</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const handleOpenPanel = (toolCallId: string) => {
        dispatch(setActiveToolCallId(toolCallId))
        dispatch(setResponsePanelWidth(500))
        dispatch(setActiveMessageId(messageId))
        const event = new CustomEvent("toolCallSelected", {
            detail: { toolCallId, messageId },
        })
        window.dispatchEvent(event)
    }
    
    const handleViewResults = () => {
      // Don't dispatch if the View Results button shouldn't be shown
      // This prevents accidental panel opening when data is invalid
      if (!canDisplayInResponsePanel()) {
        return;
      }
      
      if (toolCall?.id != null) {
        dispatch(setActiveToolCallId(toolCall?.id))
      }
      dispatch(setResponsePanelWidth(500))
    }

    const getToolIcon = (toolName: string | undefined) => {
        if (!toolName) {
            return <Code className="h-5 w-5" />
        }

        const toolType = toolName.toLowerCase()
        if (toolType.includes("graph") || toolType.includes("chart") || toolType.includes("visualizationV1")) {
            return <BarChart2 className="h-5 w-5" />
        } else if (toolType.includes("table") || toolType.includes("sheet") || toolType.includes("data")) {
            return <Table className="h-5 w-5" />
        } else {
            return <Code className="h-5 w-5" />
        }
    }

    const formatToolName = (name: string | undefined) => {
        if (!name) return "Tool Call"

        const simpleName = name.split("/").pop() || name
        return simpleName
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^\w/, (c) => c.toUpperCase())
            .trim()
    }

    const getStatusConfig = () => {
        if (isProcessing) {
            return {
                gradient: "from-blue-50 via-indigo-50 to-purple-50",
                border: "border-blue-200/60",
                ring: "ring-blue-500/20",
                iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
                iconColor: "text-white",
                statusIcon: <Loader2 className="h-4 w-4 animate-spin" />,
                statusText: "Processing",
                statusColor: "text-blue-700",
                accent: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
            }
        }

        if (hasError) {
            return {
                gradient: "from-red-50 via-rose-50 to-pink-50",
                border: "border-red-200/60",
                ring: "ring-red-500/20",
                iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
                iconColor: "text-white",
                statusIcon: <AlertCircle className="h-4 w-4" />,
                statusText: "Error",
                statusColor: "text-red-700",
                accent: "bg-gradient-to-r from-red-500/10 to-rose-500/10",
            }
        }

        if (isToolCompleted) {
            return {
                gradient: "from-emerald-50 via-green-50 to-teal-50",
                border: "border-emerald-200/60",
                ring: "ring-emerald-500/20",
                iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
                iconColor: "text-white",
                statusIcon: <CheckCircle2 className="h-4 w-4" />,
                statusText: "Completed",
                statusColor: "text-emerald-700",
                accent: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
            }
        }

        return {
            gradient: "from-slate-50 via-gray-50 to-zinc-50",
            border: "border-gray-200/60",
            ring: "ring-gray-500/20",
            iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
            iconColor: "text-white",
            statusIcon: null,
            statusText: "Pending",
            statusColor: "text-gray-700",
            accent: "bg-gradient-to-r from-gray-500/10 to-slate-500/10",
        }
    }

    const statusConfig = getStatusConfig()

    const renderArgs = () => {
        if (!toolCall?.args || Object.keys(toolCall.args).length === 0) {
            return (
                <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                        <Code className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm">No arguments provided</p>
                    </div>
                </div>
            )
        }

        try {
            // Check if there's a user_request in the response
            const responseData = response?.data;
            let userRequest = null;
            
            if (responseData) {
                if (typeof responseData === 'string') {
                    try {
                        const parsed = JSON.parse(responseData);
                        userRequest = parsed.user_request || parsed.userrequest;
                    } catch (e) {
                        // Not JSON, continue with regular display
                    }
                } else if (typeof responseData === 'object') {
                    userRequest = responseData.user_request || responseData.userrequest;
                }
            }
            
            // If we have a user_request, display it
            if (userRequest) {
                return (
                    <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-lg border border-gray-200/50 bg-gradient-to-br from-gray-50 to-slate-50F">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
                            <div className="p-3 border-b border-gray-100 bg-white">
                                <h4 className="text-sm font-medium text-gray-800">User Request</h4>
                            </div>
                            <pre className="p-4 text-sm overflow-auto bg-white max-h-60 text-gray-800 leading-relaxed">
                                {JSON.stringify(userRequest, null, 2)}
                            </pre>
                        </div>
                        
                        <div className="relative overflow-hidden rounded-lg border border-gray-200/50 bg-gradient-to-br from-gray-50 to-slate-50">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                            <div className="p-3 border-b border-gray-100 bg-white">
                                <h4 className="text-sm font-medium text-gray-800">Tool Arguments</h4>
                            </div>
                            <pre className="p-4 text-sm overflow-auto bg-white max-h-60 text-gray-800 leading-relaxed">
                                {JSON.stringify(toolCall.args, null, 2)}
                            </pre>
                        </div>
                    </div>
                )
            }
            
            // Default display if no user_request
            return (
                <div className="relative overflow-hidden rounded-lg border border-gray-200/50 bg-gradient-to-br from-gray-50 to-slate-50">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <pre className="p-4 text-sm overflow-auto max-h-96 text-gray-800 leading-relaxed">
                        {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                </div>
            )
        } catch (error) {
            return (
                <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm">Unable to parse arguments</p>
                    </div>
                </div>
            )
        }
    }

    const renderError = () => {
        if (hasError) {
            let errorMessage = "An unexpected error occurred while processing this tool call."
            
            if (response && response.data) {
                if (typeof response.data === 'string') {
                    errorMessage = response.data
                } else if (typeof response.data === 'object') {
                    // Handle the case where data might be an object with error information
                    if (response.data.error) {
                        errorMessage = response.data.error
                    } else {
                        try {
                            errorMessage = JSON.stringify(response.data)
                        } catch (e) {
                            // Keep default message if JSON stringification fails
                        }
                    }
                }
            }
            
            return (
                <div className="relative overflow-hidden rounded-lg border border-red-200/50 bg-gradient-to-br from-red-50 to-rose-50">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5" />
                    <div className="relative flex items-start gap-3 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 ring-2 ring-red-200/50 mt-0.5">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-red-800 mb-1">Execution Error</h5>
                            <p className="text-sm text-red-700 leading-relaxed">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }
    
    // Check if the response can be displayed in the ResponsePanel
    const canDisplayInResponsePanel = () => {
        if (!response) return false;
        
        // Check for specific error messages
        const hasInvalidDataFormatError = 
            (typeof response.data === 'string' && 
              response.data.includes("Invalid data format provided")) ||
            (typeof response.data === 'object' && 
              response.data && 
              (response.data.error === "Invalid data format provided" || 
               response.data.localError === "Invalid data format provided"));
              
        if (hasInvalidDataFormatError) {
            return false;
        }
        
        // For table type, verify the report_table property exists and is valid
        if (response.type === "table") {
            try {
                const data = typeof response.data === 'string' 
                    ? JSON.parse(response.data) 
                    : response.data;
                
                // Ensure the report_table property exists and is not null/undefined
                if (!data || !data.report_table) {
                    return false;
                }
                
                return true;
            } catch (e) {
                return false;
            }
        }
        
        // For graph type, verify schema or data structure exists
        if (response.type === "graph") {
            try {
                const data = typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data;
                
                // Check for valid graph data structure
                if (!data || (!data.schema && !data.data)) {
                    return false;
                }
                
                return true;
            } catch (e) {
                return false;
            }
        }
        
        // Don't show view button for other response types
        return false;
    }

    return (
        <div className={cn("my-4 transition-all duration-300", inline ? "mx-2" : "mx-0")}>
            <div
                className={cn(
                    "group relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300",
                    statusConfig.border,
                    `bg-gradient-to-br ${statusConfig.gradient}`,
                    isHovered && "shadow-xl scale-[1.02] ring-4",
                    isHovered && statusConfig.ring,
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Animated background accent */}
                <div
                    className={cn(
                        "absolute inset-0 opacity-50 transition-opacity duration-300",
                        statusConfig.accent,
                        isHovered && "opacity-70",
                    )}
                />

                {/* Shimmer effect for processing state */}
                {isProcessing && (
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}

                {/* Header */}
                <div
                    className="relative flex items-center justify-between p-4 cursor-pointer transition-all duration-200 hover:bg-white/30"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        {/* Tool Icon */}
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-all duration-300",
                                statusConfig.iconBg,
                                statusConfig.iconColor,
                                isHovered && "scale-110 shadow-xl",
                            )}
                        >
                            {getToolIcon(toolCall?.name)}
                        </div>

                        {/* Tool Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{formatToolName(toolCall?.name)}</h3>
                                {isProcessing && <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />}
                            </div>
                            <div className="flex items-center gap-2">
                                {statusConfig.statusIcon}
                                <span className={cn("text-sm font-medium", statusConfig.statusColor)}>{statusConfig.statusText}</span>
                                {isToolCompleted && !hasError && (
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        <Zap className="h-3 w-3" />
                                        Ready
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expand Button */}
                    {/*<div className="flex items-center gap-2">*/}
                    {/*    <div*/}
                    {/*        className={cn(*/}
                    {/*            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",*/}
                    {/*            "bg-white/50 hover:bg-white/80 shadow-sm",*/}
                    {/*            isExpanded && "rotate-180",*/}
                    {/*        )}*/}
                    {/*    >*/}
                    {/*        <ChevronDown className="h-4 w-4 text-gray-600" />*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="relative border-t border-white/50 bg-white/20 backdrop-blur-sm">
                        <div className="p-6 space-y-6">
                            {/* Arguments Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100">
                                        <Code className="h-3 w-3 text-gray-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Arguments</h4>
                                </div>
                                {renderArgs()}
                            </div>

                            {/* Error Display */}
                            {renderError()}

                            {/* Action Button - Only show when panel can actually be opened */}
                            {isToolCompleted && !hasError && toolCall?.id && canDisplayInResponsePanel() && (
                                <Button
                                    onClick={handleViewResults}
                                    className={cn(
                                        "w-full h-12 text-sm font-medium transition-all duration-200",
                                        "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
                                        "text-white shadow-lg hover:shadow-xl hover:scale-[1.02]",
                                        "border-0 rounded-lg",
                                    )}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Results
                                    <Sparkles className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ToolCallDisplay
