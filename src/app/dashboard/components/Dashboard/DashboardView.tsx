"use client";

import { v4 as uuidv4 } from "uuid";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import GridElement from "./GridElement";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { Block, BlockType, DashboardItem, DraggingBlock } from "../../types";
import { LayoutGridIcon } from "lucide-react";
import { toast } from "sonner";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
    className?: string;
    dashboardItems: DashboardItem[];
    setDashboardItems: (items: DashboardItem[] | ((prevItems: DashboardItem[]) => DashboardItem[])) => void;
    blocks: Block[];
    setBlocks: (blocksUpdater: (prevBlocks: Block[]) => Block[]) => void;
    draggingBlock: DraggingBlock | null;
    onAddBlock?: (itemId: string) => void;
    isEditing: boolean;
    // isSidebarCollapsed prop removed
}

const MARGIN: [number, number] = [12, 12];
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const BREAKPOINT_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 100;

function getMins(t: BlockType): { minW: number; minH: number } {
    switch (t) {
        case "SQL": return { minW: 3, minH: 2 };
        case "Visualization": return { minW: 4, minH: 3 };
        case "Python": return { minW: 3, minH: 2 };
        case "DashboardHeader": return { minW: BREAKPOINT_COLS.lg, minH: 1 };
        default: return { minW: 2, minH: 2 };
    }
}

function getDefaults(t: BlockType): { w: number; h: number } {
    switch (t) {
        case "SQL": return { w: 5, h: 3 };
        case "Visualization": return { w: 6, h: 4 };
        case "Python": return { w: 4, h: 3 };
        case "DashboardHeader": return { w: BREAKPOINT_COLS.lg, h: 1 };
        default: return { w: 4, h: 2 };
    }
}

function generateBackgroundPattern(gridWidth: number, rowHeight: number, marginH: number, marginV: number, cols: number): string {
    if (gridWidth <= 0 || cols <= 0 || rowHeight <=0) return "";
    const cellWidth = (gridWidth - (marginH * (cols + 1))) / cols;
    const cellHeight = rowHeight;
    const dots = [];
    const numVerticalCellsToDraw = Math.max(20, Math.ceil(1500 / (cellHeight + marginV)) + 2);

    for (let y = 0; y < numVerticalCellsToDraw; y++) {
        for (let x = 0; x < cols +1 ; x++) {
            const dotX = x * (cellWidth + marginH) + marginH;
            const dotY = y * (cellHeight + marginV) + marginV;
            dots.push(`<circle cx="${dotX}" cy="${dotY}" r="1.5" fill="#d1d5db" />`);
        }
    }
    const svgHeight = numVerticalCellsToDraw * (cellHeight + marginV) + marginV;
    const svgWidth = gridWidth;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">${dots.join("")}</svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}


export default function DashboardView({
                                          className,
                                          dashboardItems,
                                          setDashboardItems,
                                          blocks,
                                          draggingBlock,
                                          onAddBlock,
                                          isEditing,
                                      }: DashboardViewProps) {
    const [dragOverIndicator, setDragOverIndicator] = useState(false);
    const [currentGridWidth, setCurrentGridWidth] = useState(BREAKPOINTS.lg);
    const [currentCols, setCurrentCols] = useState(BREAKPOINT_COLS.lg);
    const rglRef = useRef<any>(null);

    // Removed useEffect related to isSidebarCollapsed

    const layout = useMemo(
        () =>
            dashboardItems.map((item) => ({
                i: item.id, x: item.x, y: item.y, w: item.w, h: item.h,
                minW: item.minW, minH: item.minH,
                isDraggable: isEditing, isResizable: isEditing,
            })),
        [dashboardItems, isEditing]
    );

    const onLayoutChange = useCallback(
        (newLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
            const hasChanges = newLayout.some((newItem) => {
                const oldItem = dashboardItems.find((item) => item.id === newItem.i);
                return (!oldItem || oldItem.x !== newItem.x || oldItem.y !== newItem.y || oldItem.w !== newItem.w || oldItem.h !== newItem.h);
            });

            if (hasChanges && isEditing) {
                const updatedItems = dashboardItems.map((item) => {
                    const layoutItem = newLayout.find((l) => l.i === item.id);
                    return layoutItem ? { ...item, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h } : item;
                }).filter(Boolean) as DashboardItem[];
                setDashboardItems(updatedItems);
            }
        },
        [dashboardItems, setDashboardItems, isEditing]
    );

    const onDeleteItem = useCallback((idToDelete: string) => {
        setDashboardItems((prevItems: DashboardItem[]) => prevItems.filter((item) => item.id !== idToDelete));
        toast.success("Component removed from dashboard.");
    }, [setDashboardItems]);


    const onDrop = useCallback(
        (gridLayout: Layout[], layoutItem: Layout, event: DragEvent) => {
            event.preventDefault();
            setDragOverIndicator(false);
            const blockTemplateId = event.dataTransfer?.getData("text/plain");
            if (!blockTemplateId || !draggingBlock || draggingBlock.id !== blockTemplateId) {
                console.warn("Mismatched or missing drag data for drop."); return;
            }
            const blockToAdd = blocks.find((b) => b.id === blockTemplateId);
            if (!blockToAdd) {
                toast.error(`Component (ID: ${blockTemplateId}) definition not found.`); return;
            }
            const defaultSize = getDefaults(blockToAdd.type);
            const mins = getMins(blockToAdd.type);
            const colsForCurrentBreakpoint = currentCols || BREAKPOINT_COLS.lg;
            const newItemId = uuidv4();
            const newItem: DashboardItem = {
                id: newItemId, blockId: blockToAdd.id,
                x: Math.max(0, Math.min(layoutItem.x, colsForCurrentBreakpoint - defaultSize.w)),
                y: layoutItem.y, w: defaultSize.w, h: defaultSize.h,
                minW: mins.minW, minH: mins.minH,
            };
            setDashboardItems((prevItems: DashboardItem[]) => [...prevItems, newItem]);
            if (onAddBlock) onAddBlock(newItemId);
            toast.success(`"${blockToAdd.title}" added to dashboard!`);
        },
        [draggingBlock, blocks, currentCols, onAddBlock, setDashboardItems]
    );

    const handleDragOverWrapper = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (draggingBlock && isEditing) setDragOverIndicator(true);
    }, [draggingBlock, isEditing]);
    const handleDragLeaveWrapper = useCallback(() => setDragOverIndicator(false), []);
    const handleDropOnWrapper = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverIndicator(false);
    }, []);

    const onWidthChange = useCallback((containerWidth: number, margin: [number, number], cols: number, containerPadding: [number,number]) => {
        setCurrentGridWidth(containerWidth);
        setCurrentCols(cols);
    }, []);
    const onBreakpointChange = useCallback((newBreakpoint: string, newCols: number) => setCurrentCols(newCols), []);

    const gridElementChildren = useMemo(() => layout.map((itemLayout) => {
        const dashboardItem = dashboardItems.find((di) => di.id === itemLayout.i);
        const blockTemplate = blocks.find((b) => b.id === dashboardItem?.blockId);
        if (!dashboardItem) return null;
        return (
            <div key={itemLayout.i} className="react-grid-item group/item outline-none focus:outline-none">
                <GridElement
                    item={itemLayout} block={blockTemplate} dashboardItem={dashboardItem}
                    onDelete={onDeleteItem} isEditingDashboard={isEditing}
                />
            </div>
        );
    }), [layout, dashboardItems, blocks, onDeleteItem, isEditing]);

    const backgroundStyle = isEditing && currentGridWidth > 0 && currentCols > 0
        ? {
            backgroundImage: generateBackgroundPattern(currentGridWidth, ROW_HEIGHT, MARGIN[0], MARGIN[1], currentCols),
            backgroundRepeat: "repeat",
            backgroundPosition: `${MARGIN[0]}px ${MARGIN[1]}px`,
            minHeight: "calc(100vh - 65px - 24px)",
        }
        : { minHeight: "auto", background: isEditing ? '#f8fafc' : '#f1f5f9' };

    return (
        <div
            className={cn(
                "dashboard-view-container flex-grow transition-all duration-300 relative",
                "overflow-y-auto overflow-x-hidden",
                className,
                dragOverIndicator && isEditing && "outline-dashed outline-2 outline-offset-[-3px] outline-blue-500 bg-blue-100/70",
                !isEditing && "p-1 md:p-2 bg-slate-100"
            )}
            onDragOver={handleDragOverWrapper} onDragLeave={handleDragLeaveWrapper} onDrop={handleDropOnWrapper}
            style={{ minHeight: 'calc(100vh - 65px)'}}
        >
            <ResponsiveGridLayout
                ref={rglRef} layouts={{ lg: layout }} breakpoints={BREAKPOINTS} cols={BREAKPOINT_COLS}
                rowHeight={ROW_HEIGHT} margin={MARGIN} containerPadding={isEditing ? [MARGIN[0], MARGIN[1]] : [0,0]}
                onLayoutChange={onLayoutChange} onWidthChange={onWidthChange} onBreakpointChange={onBreakpointChange}
                isDraggable={isEditing} isResizable={isEditing} isDroppable={isEditing} onDrop={onDrop}
                resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w']} draggableHandle=".drag-handle"
                draggableCancel=".grid-element-button, input, textarea, button, select, .monaco-editor, .echarts-for-react, .no-drag"
                className={cn("min-h-full", !isEditing && "dashboard-view-mode")} style={backgroundStyle}
                useCSSTransforms={true} measureBeforeMount={false} compactType="vertical" preventCollision={false}
            >
                {gridElementChildren}
            </ResponsiveGridLayout>
            {(dashboardItems.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-base pointer-events-none p-10 text-center">
                    <LayoutGridIcon className="w-16 h-16 text-slate-300 mb-4"/>
                    <span>{isEditing ? "Your dashboard is empty." : "This dashboard is currently empty."}</span>
                    <span className="text-sm">{isEditing ? "Drag components from the right panel to get started." : "Switch to Edit Mode to add components."}</span>
                </div>
            )}
        </div>
    );
}
