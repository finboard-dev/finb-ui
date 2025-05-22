"use client";

import { useCallback } from "react";
import {
    Edit3Icon,
    Trash2Icon,
    GripVerticalIcon,
    MoreVerticalIcon,
    AlertTriangleIcon,
    Loader2Icon,
    CopyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block, DashboardItem } from "../../types";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EChartsRenderer = dynamic(() => import("@/app/components/visualizationV2/VisualizationRenderer").catch(() => () => <ErrorDisplay message="Chart renderer failed to load." />), {
    ssr: false,
    loading: () => <LoadingDisplay message="Loading chart..." />
});
const DynamicTable = dynamic(() => import("@/app/tests/components/DynamicTableRenderer").catch(() => () => <ErrorDisplay message="Table renderer failed to load." />), {
    ssr: false,
    loading: () => <LoadingDisplay message="Loading table..." />
});
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default).catch(() => () => <ErrorDisplay message="Code editor failed to load." />), {
    ssr: false,
    loading: () => <LoadingDisplay message="Loading editor..." />
});

interface GridElementProps {
    item: any;
    block: Block | undefined;
    dashboardItem?: DashboardItem;
    onDelete: (id: string) => void;
    isEditingDashboard: boolean;
}

function LoadingDisplay({ message }: { message: string }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <Loader2Icon className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <span className="text-sm">{message}</span>
        </div>
    );
}

function ErrorDisplay({ message, details }: { message: string; details?: string }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 bg-red-50 rounded-md border border-red-200">
            <AlertTriangleIcon className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">{message}</span>
            {details && <p className="text-xs mt-1 text-red-500">{details}</p>}
        </div>
    );
}

export default function GridElement({ item, block, dashboardItem, onDelete, isEditingDashboard }: GridElementProps) {
    const onDeleteHandler = useCallback(() => onDelete(item.i), [onDelete, item.i]);

    const onEditHandler = () => {
        console.log("Edit block instance:", item.i, "template:", block?.id);
        toast.info(`Edit for "${block?.title || 'component'}" TBD.`);
    };

    const onDuplicateHandler = () => {
        console.log("Duplicate block instance:", item.i);
        toast.info(`Duplicate for "${block?.title || 'component'}" TBD.`);
    };

    const renderBlockContent = () => {
        if (!block) return <ErrorDisplay message="Component data missing." details={`ID: ${dashboardItem?.blockId}`} />;
        try {
            switch (block.type) {
                case "Visualization":
                    let visSchema: echarts.EChartsOption | null = null;
                    if (typeof block.content === 'string') {
                        try { visSchema = JSON.parse(block.content); }
                        catch (e: any) { return <ErrorDisplay message="Invalid chart data." details={e.message} />; }
                    } else if (typeof block.content === 'object' && block.content !== null) {
                        visSchema = block.content;
                    } else return <ErrorDisplay message="Missing chart data." />;
                    if (!visSchema) return <ErrorDisplay message="Chart config is null." />;
                    return (
                        <div className="w-full h-full p-1" style={{ minHeight: '150px' }}>
                            <EChartsRenderer config={visSchema} />
                        </div>
                    );
                case "SQL":
                    let tableDataArray: any[] | null = null;
                    if (typeof block.content === 'string') {
                        try {
                            const parsed = JSON.parse(block.content);
                            if (Array.isArray(parsed)) tableDataArray = parsed;
                            else if (parsed && Array.isArray(parsed.report_table)) tableDataArray = parsed.report_table;
                            else if (parsed && Array.isArray(parsed.data)) tableDataArray = parsed.data;
                        } catch (e: any) { return <ErrorDisplay message="Invalid table data." details={e.message} />; }
                    } else if (Array.isArray(block.content)) tableDataArray = block.content;
                    else if (block.content && typeof block.content === 'object') {
                        if (Array.isArray((block.content as any).report_table)) tableDataArray = (block.content as any).report_table;
                        else if (Array.isArray((block.content as any).data)) tableDataArray = (block.content as any).data;
                    }
                    if (!tableDataArray || !Array.isArray(tableDataArray)) return <ErrorDisplay message="Table data missing or not array." />;
                    if (tableDataArray.length === 0) return <div className="p-4 text-sm text-slate-500 text-center">No data for table.</div>;
                    return (
                        <div className="w-full h-full overflow-auto p-1">
                            <DynamicTable data={tableDataArray} isLoading={false} error={null} />
                        </div>
                    );
                case "Python":
                    const code = typeof block.content === 'string' ? block.content : "// Invalid Python: Expected string.";
                    return (
                        <div className="w-full h-full [&>div]:h-full bg-white no-drag rounded-b-md overflow-hidden">
                            <MonacoEditor
                                height="100%" width="100%" language="python"
                                theme="vs-light"
                                value={code}
                                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on", fontSize: 13, lineNumbers: "off", automaticLayout: true }}
                            />
                        </div>
                    );
                case "DashboardHeader":
                    return (
                        // Ensure header content doesn't cause overflow issues with its own padding if card has none.
                        <div className="p-3 md:p-4 h-full flex flex-col justify-center bg-slate-50 rounded-b-md">
                            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-1 truncate" title={block.title}>
                                {block.title}
                            </h2>
                            {block.content && typeof block.content === 'string' && (
                                <p className="text-sm text-slate-600 line-clamp-2">{block.content}</p>
                            )}
                        </div>
                    );
                default:
                    const contentStr = typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2);
                    return <div className="p-4 text-sm whitespace-pre-wrap break-words text-slate-700 overflow-auto">{contentStr || "No content."}</div>;
            }
        } catch (error: any) {
            return <ErrorDisplay message="Error rendering." details={error.message || String(error)} />;
        }
    };

    const dragHandleClass = isEditingDashboard ? "drag-handle cursor-grab" : "cursor-default";

    return (
        <Card className={cn(
            "h-full w-full flex flex-col bg-white overflow-hidden rounded-lg shadow-sm border border-slate-200", // Explicitly add light gray border
            isEditingDashboard ? "hover:shadow-md hover:border-slate-300" : "border-slate-200" // Slightly darker border on hover when editing
        )}>
            {(isEditingDashboard || (block && block.type !== "DashboardHeader")) && (
                <CardHeader className={cn(
                    "flex flex-row items-center justify-between space-y-0 py-2 px-3 h-[45px] flex-shrink-0",
                    "bg-slate-50 border-b border-slate-200"
                )}>
                    <div className={cn("flex items-center gap-1.5 flex-grow min-w-0", dragHandleClass)}>
                        {isEditingDashboard && (
                            <span className="text-slate-400 hover:text-slate-600 p-0.5" aria-label="Drag to reorder">
                                <GripVerticalIcon className="h-5 w-5" />
                            </span>
                        )}
                        <CardTitle className="text-sm font-semibold text-slate-700 truncate" title={block?.title || "Untitled"}>
                            {block?.title || "Untitled"}
                        </CardTitle>
                    </div>
                    {isEditingDashboard && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-7 h-7 grid-element-button text-slate-500 hover:text-slate-700 hover:bg-slate-200">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white shadow-xl border-slate-200 z-[100]">
                                <DropdownMenuItem onClick={onEditHandler} className="text-sm opt"> <Edit3Icon className="w-3.5 h-3.5 mr-2" /> Edit </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDuplicateHandler} className="text-sm opt"> <CopyIcon className="w-3.5 h-3.5 mr-2" /> Duplicate </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200"/>
                                <DropdownMenuItem onClick={onDeleteHandler} className="text-sm text-red-600 hover:!text-red-500 hover:!bg-red-50 focus:!bg-red-50 focus:!text-red-600 opt"> <Trash2Icon className="w-3.5 h-3.5 mr-2" /> Delete </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
            )}
            <CardContent className={cn(
                "flex-grow overflow-auto relative",
                // For Python and Visualization, ensure no internal padding if the component itself handles it.
                (block?.type === "Visualization") ? "p-0" : // Visualization often needs full control
                    (block?.type === "Python") ? "p-0" : // Python editor also needs full control
                        (block?.type === "DashboardHeader" && !isEditingDashboard) ? "p-0" : // Header in view mode might be full bleed
                            "p-2 md:p-3" // Default padding for other types or header in edit mode
            )}>
                {renderBlockContent()}
            </CardContent>
        </Card>
    );
}