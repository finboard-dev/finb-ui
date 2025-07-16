"use client";

import type React from "react";

import { v4 as uuidv4 } from "uuid";
import { type Layout, Responsive, WidthProvider } from "react-grid-layout";
import { useCallback, useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type {
  Block,
  BlockType,
  DashboardItem,
  DraggingBlock,
} from "../../types";
import { LayoutGridIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import MetricsCard from "../ui/MetricsCard";
import DynamicTable from "@/app/tests/components/DynamicTableRenderer";
import RestrictedChart from "@/components/visualizationV2/VisualizationRenderer";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  className?: string;
  dashboardItems: DashboardItem[];
  setDashboardItems: (
    items: DashboardItem[] | ((prevItems: DashboardItem[]) => DashboardItem[])
  ) => void;
  blocks: Block[];
  draggingBlock: DraggingBlock | null;
  isEditing: boolean;
}

const MARGIN: [number, number] = [8, 8];
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const GRID_GRANULARITY = 4;
const BREAKPOINT_COLS = {
  lg: 12 * GRID_GRANULARITY,
  md: 10 * GRID_GRANULARITY,
  sm: 6 * GRID_GRANULARITY,
  xs: 4 * GRID_GRANULARITY,
  xxs: 2 * GRID_GRANULARITY,
};
const ROW_HEIGHT = 20;

function getMins(t: BlockType): { minW: number; minH: number } {
  const factor = GRID_GRANULARITY;
  switch (t) {
    case "table":
      return { minW: 3 * factor, minH: 2 * factor };
    case "graph":
      return { minW: 3 * factor, minH: 2 * factor };
    case "metric":
      return { minW: 2 * factor, minH: 1 * factor };
    default:
      return { minW: 2 * factor, minH: 1 * factor };
  }
}

function getDefaults(t: BlockType): { w: number; h: number } {
  const factor = GRID_GRANULARITY;
  switch (t) {
    case "table":
      return { w: 4 * factor, h: 3 * factor };
    case "graph":
      return { w: 4 * factor, h: 3 * factor };
    case "metric":
      return { w: 2 * factor, h: 1 * factor };
    default:
      return { w: 3 * factor, h: 2 * factor };
  }
}

function generateBackgroundPattern(
  gridWidth: number,
  rowHeight: number,
  marginH: number,
  marginV: number,
  cols: number
): string {
  if (gridWidth <= 0 || cols <= 0 || rowHeight <= 0) return "";
  const cellWidth = (gridWidth - marginH * (cols + 1)) / cols;
  const cellHeight = rowHeight;
  const dots = [];
  const numVerticalCellsToDraw = Math.max(
    20,
    Math.ceil(1200 / (cellHeight + marginV)) + 2
  );

  for (let y = 0; y < numVerticalCellsToDraw; y++) {
    for (let x = 0; x < cols + 1; x++) {
      const dotX = x * (cellWidth + marginH) + marginH;
      const dotY = y * (cellHeight + marginV) + marginV;
      dots.push(`<circle cx="${dotX}" cy="${dotY}" r="1" fill="#e2e8f0" />`);
    }
  }
  const svgHeight = numVerticalCellsToDraw * (cellHeight + marginV) + marginV;
  const svgWidth = gridWidth;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">${dots.join(
    ""
  )}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function DashboardView({
  className,
  dashboardItems,
  setDashboardItems,
  blocks,
  draggingBlock,
  isEditing,
}: DashboardViewProps) {
  const [dragOverIndicator, setDragOverIndicator] = useState(false);
  const [currentGridWidth, setCurrentGridWidth] = useState(BREAKPOINTS.lg);
  const [currentCols, setCurrentCols] = useState(BREAKPOINT_COLS.lg);
  const rglRef = useRef<any>(null);

  const layout = useMemo(
    () =>
      dashboardItems.map((item) => {
        const block = blocks.find((b) => b.id === item.blockId);
        const mins = block ? getMins(block.type) : { minW: 2, minH: 1 };

        return {
          i: item.id,
          x: item.x,
          y: item.y,
          w: Math.max(item.w, mins.minW),
          h: Math.max(item.h, mins.minH),
          minW: mins.minW,
          minH: mins.minH,
          isDraggable: isEditing,
          isResizable: isEditing,
        };
      }),
    [dashboardItems, blocks, isEditing]
  );

  const onLayoutChange = useCallback(
    (newLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
      const hasChanges = newLayout.some((newItem) => {
        const oldItem = dashboardItems.find((item) => item.id === newItem.i);
        return (
          !oldItem ||
          oldItem.x !== newItem.x ||
          oldItem.y !== newItem.y ||
          oldItem.w !== newItem.w ||
          oldItem.h !== newItem.h
        );
      });

      if (hasChanges && isEditing) {
        const updatedItems = dashboardItems
          .map((item) => {
            const layoutItem = newLayout.find((l) => l.i === item.id);
            if (!layoutItem) return item;

            const block = blocks.find((b) => b.id === item.blockId);
            const mins = block ? getMins(block.type) : { minW: 2, minH: 1 };

            return {
              ...item,
              x: layoutItem.x,
              y: layoutItem.y,
              w: Math.max(layoutItem.w, mins.minW),
              h: Math.max(layoutItem.h, mins.minH),
              minW: mins.minW,
              minH: mins.minH,
            };
          })
          .filter(Boolean) as DashboardItem[];
        setDashboardItems(updatedItems);
      }
    },
    [dashboardItems, setDashboardItems, blocks, isEditing]
  );

  const onDeleteItem = useCallback(
    (idToDelete: string) => {
      setDashboardItems((prevItems: DashboardItem[]) =>
        prevItems.filter((item) => item.id !== idToDelete)
      );
      toast.success("Component removed from dashboard.");
    },
    [setDashboardItems]
  );

  const onDrop = useCallback(
    (gridLayout: Layout[], layoutItem: Layout, event: DragEvent) => {
      event.preventDefault();
      setDragOverIndicator(false);
      const blockTemplateId = event.dataTransfer?.getData("text/plain");

      console.log("Drop event:", {
        blockTemplateId,
        draggingBlock,
        totalBlocks: blocks.length,
        blockIds: blocks.map((b) => b.id),
      });

      if (
        !blockTemplateId ||
        !draggingBlock ||
        draggingBlock.id !== blockTemplateId
      ) {
        console.warn("Mismatched or missing drag data for drop.");
        return;
      }
      const blockToAdd = blocks.find((b) => b.id === blockTemplateId);

      console.log(
        "Found block to add:",
        blockToAdd
          ? {
              id: blockToAdd.id,
              title: blockToAdd.title,
              type: blockToAdd.type,
              hasContent: !!blockToAdd.content,
            }
          : null
      );

      if (!blockToAdd) {
        toast.error(`Component (ID: ${blockTemplateId}) definition not found.`);
        return;
      }
      const defaultSize = getDefaults(blockToAdd.type);
      const mins = getMins(blockToAdd.type);
      const colsForCurrentBreakpoint = currentCols || BREAKPOINT_COLS.lg;
      const newItemId = uuidv4();
      const newItem: DashboardItem = {
        id: newItemId,
        blockId: blockToAdd.id,
        x: Math.max(
          0,
          Math.min(layoutItem.x, colsForCurrentBreakpoint - defaultSize.w)
        ),
        y: layoutItem.y,
        w: defaultSize.w,
        h: defaultSize.h,
        minW: mins.minW,
        minH: mins.minH,
      };
      setDashboardItems((prevItems: DashboardItem[]) => [
        ...prevItems,
        newItem,
      ]);
      toast.success(`"${blockToAdd.title}" added to dashboard!`);
    },
    [draggingBlock, blocks, currentCols, setDashboardItems]
  );

  const handleDragOverWrapper = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (draggingBlock && isEditing) setDragOverIndicator(true);
    },
    [draggingBlock, isEditing]
  );

  const handleDragLeaveWrapper = useCallback(
    () => setDragOverIndicator(false),
    []
  );
  const handleDropOnWrapper = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverIndicator(false);
    },
    []
  );

  const onWidthChange = useCallback(
    (containerWidth: number, margin: [number, number], cols: number) => {
      setCurrentGridWidth(containerWidth);
      setCurrentCols(cols);
    },
    []
  );

  const onBreakpointChange = useCallback(
    (newBreakpoint: string, newCols: number) => setCurrentCols(newCols),
    []
  );

  const gridElementChildren = useMemo(
    () =>
      layout.map((itemLayout) => {
        const dashboardItem = dashboardItems.find(
          (di) => di.id === itemLayout.i
        );
        const blockTemplate = blocks.find(
          (b) => b.id === dashboardItem?.blockId
        );

        console.log("Rendering dashboard item:", {
          itemId: dashboardItem?.id,
          blockId: dashboardItem?.blockId,
          blockTemplate: blockTemplate
            ? {
                id: blockTemplate.id,
                title: blockTemplate.title,
                type: blockTemplate.type,
                hasContent: !!blockTemplate.content,
                contentType: typeof blockTemplate.content,
              }
            : null,
          totalBlocks: blocks.length,
        });

        if (!dashboardItem || !blockTemplate) {
          return (
            <div
              key={itemLayout.i}
              className="w-full h-full flex flex-col items-center justify-center text-red-600 p-2 bg-red-50 rounded-md border border-red-200"
            >
              <AlertTriangleIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Component missing</span>
            </div>
          );
        }

        return (
          <div
            key={itemLayout.i}
            className="react-grid-item group/item outline-none focus:outline-none relative"
          >
            {blockTemplate.type === "graph" && (
              <RestrictedChart
                data={blockTemplate.content || {}}
                title={blockTemplate.title}
                subtitle={blockTemplate.subtitle}
                showDragHandle={isEditing}
                dragHandleProps={{ className: "drag-handle" }}
                showMenu={isEditing}
                onDelete={() => onDeleteItem(itemLayout.i)}
                onEdit={() =>
                  toast.info(
                    `Edit for "${blockTemplate?.title || "component"}" TBD.`
                  )
                }
                onDuplicate={() =>
                  toast.info(
                    `Duplicate for "${
                      blockTemplate?.title || "component"
                    }" TBD.`
                  )
                }
                className="h-full w-full"
                style={{ borderRadius: isEditing ? "0px" : "6px" }}
              />
            )}
            {blockTemplate.type === "table" && (
              <DynamicTable
                data={blockTemplate.content || ""}
                title={blockTemplate.title}
                showDragHandle={isEditing}
                dragHandleProps={{ className: "drag-handle" }}
                showMenu={isEditing}
                onDelete={() => onDeleteItem(itemLayout.i)}
                onEdit={() =>
                  toast.info(
                    `Edit for "${blockTemplate?.title || "component"}" TBD.`
                  )
                }
                onDuplicate={() =>
                  toast.info(
                    `Duplicate for "${
                      blockTemplate?.title || "component"
                    }" TBD.`
                  )
                }
                className="h-full w-full"
                style={{ borderRadius: isEditing ? "0px" : "6px" }}
              />
            )}
            {blockTemplate.type === "metric" && (
              <MetricsCard
                title={blockTemplate.title}
                value={blockTemplate.content?.value || 0}
                change={blockTemplate.content?.change || 0}
                changeLabel={blockTemplate.content?.changeLabel || ""}
                showDragHandle={isEditing}
                dragHandleProps={{ className: "drag-handle" }}
                showMenu={isEditing}
                onDelete={() => onDeleteItem(itemLayout.i)}
                onEdit={() =>
                  toast.info(
                    `Edit for "${blockTemplate?.title || "component"}" TBD.`
                  )
                }
                onDuplicate={() =>
                  toast.info(
                    `Duplicate for "${
                      blockTemplate?.title || "component"
                    }" TBD.`
                  )
                }
                className="h-full w-full"
                style={{
                  borderRadius: isEditing ? "0px" : "6px",
                }}
              />
            )}
          </div>
        );
      }),
    [layout, dashboardItems, blocks, onDeleteItem, isEditing]
  );

  const backgroundStyle =
    isEditing && currentGridWidth > 0 && currentCols > 0
      ? {
          backgroundImage: generateBackgroundPattern(
            currentGridWidth,
            ROW_HEIGHT,
            MARGIN[0],
            MARGIN[1],
            currentCols
          ),
          backgroundRepeat: "repeat",
          backgroundPosition: `${MARGIN[0]}px ${MARGIN[1]}px`,
          minHeight: "calc(100vh - 65px - 16px)",
        }
      : { minHeight: "auto", background: isEditing ? "#f8fafc" : "#f1f5f9" };

  return (
    <div
      className={cn(
        "dashboard-view-container flex-grow transition-all duration-300 relative",
        "overflow-y-auto overflow-x-hidden",
        className,
        dragOverIndicator &&
          isEditing &&
          "outline-dashed outline-2 outline-offset-[-2px] outline-blue-500 bg-blue-100/50",
        !isEditing && "p-1 bg-slate-100"
      )}
      onDragOver={handleDragOverWrapper}
      onDragLeave={handleDragLeaveWrapper}
      onDrop={handleDropOnWrapper}
      style={{ minHeight: "calc(100vh - 65px)" }}
    >
      {/* Custom CSS for 8-pixel increment resize */}
      {isEditing && (
        <style jsx>{`
          .react-resizable-handle {
            transition: all 0.1s ease;
          }
          .react-resizable-handle:hover {
            background-color: rgba(59, 130, 246, 0.3);
          }
          /* Make resize more responsive to smaller movements */
          .react-grid-item {
            transition: none !important;
          }
          .react-grid-item.resizing {
            transition: none !important;
          }
        `}</style>
      )}
      <ResponsiveGridLayout
        ref={rglRef}
        layouts={{ lg: layout }}
        breakpoints={BREAKPOINTS}
        cols={BREAKPOINT_COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={isEditing ? [MARGIN[0], MARGIN[1]] : [0, 0]}
        onLayoutChange={onLayoutChange}
        onWidthChange={onWidthChange}
        onBreakpointChange={onBreakpointChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        isDroppable={isEditing}
        onDrop={onDrop}
        resizeHandles={
          isEditing ? ["se", "sw", "ne", "nw", "e", "w", "n", "s"] : []
        }
        draggableHandle=".drag-handle"
        draggableCancel=".rgl-no-drag, input, textarea, button, select"
        className={cn("min-h-full", !isEditing && "dashboard-view-mode")}
        style={backgroundStyle}
        useCSSTransforms={true}
        measureBeforeMount={false}
        compactType="vertical"
        preventCollision={false}
      >
        {gridElementChildren}
      </ResponsiveGridLayout>
      {dashboardItems.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-base pointer-events-none p-10 text-center">
          <LayoutGridIcon className="w-16 h-16 text-slate-300 mb-4" />
          <span>
            {isEditing
              ? "Your dashboard is empty."
              : "This dashboard is currently empty."}
          </span>
          <span className="text-sm">
            {isEditing
              ? "Drag components from the right panel to get started."
              : "Switch to Edit Mode to add components."}
          </span>
        </div>
      )}
    </div>
  );
}
