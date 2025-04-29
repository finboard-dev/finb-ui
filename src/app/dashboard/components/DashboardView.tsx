"use client";

import { range } from "ramda";
import { v4 as uuidv4 } from "uuid";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import GridElement from "./GridElement";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Block, BlockType, DashboardItem, DraggingBlock } from "../page";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Props {
  className?: string;
  dashboardItems: DashboardItem[];
  setDashboardItems: (items: DashboardItem[]) => void;
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  draggingBlock: DraggingBlock | null;
  latestBlockId: string | null;
  isEditing: boolean;
}

const MARGIN = 10;
const COLS_COUNT = 12; // Changed from 24 to 12 for better block sizing
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const BREAKPOINT_COLS = { lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 };
const ROW_HEIGHT = 100; // Fixed row height for consistency

function getMins(t: BlockType): { minW: number; minH: number } {
  switch (t) {
    case "SQL":
      return { minW: 4, minH: 3 }; // Adjusted for 12-column grid
    case "Visualization":
      return { minW: 4, minH: 3 };
    case "Python":
      return { minW: 3, minH: 2 };
    case "Input":
      return { minW: 3, minH: 2 };
    case "RichText":
      return { minW: 2, minH: 2 };
    case "DashboardHeader":
      return { minW: 4, minH: 1 };
  }
}

function getDefaults(t: BlockType): { w: number; h: number } {
  switch (t) {
    case "SQL":
      return { w: 6, h: 4 }; // Default sizes for new items
    case "Visualization":
      return { w: 6, h: 4 };
    case "Python":
      return { w: 4, h: 3 };
    case "Input":
      return { w: 4, h: 2 };
    case "RichText":
      return { w: 3, h: 2 };
    case "DashboardHeader":
      return { w: 12, h: 1 };
  }
}

function generateBackground(gridWidth: number): string {
  const cellWidth = (gridWidth - MARGIN * (COLS_COUNT + 1)) / COLS_COUNT;
  const cellHeight = ROW_HEIGHT - MARGIN;

  const rects = range(0, COLS_COUNT).map((i: any) => {
    const x = i * (cellWidth + MARGIN) + MARGIN;
    return `<rect stroke="#f2f1f3" stroke-width="1" fill="none" x="${x}" y="${MARGIN}" width="${cellWidth}" height="${cellHeight}" />`;
  });

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${gridWidth}" height="${ROW_HEIGHT}">`,
    ...rects,
    `</svg>`,
  ].join("");

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function DashboardView(props: Props) {
  const [dragOverIndicator, setDragOverIndicator] = useState(false);
  const [gridWidth, setGridWidth] = useState(1200);

  // Calculate layout with proper positions and sizes
  const layout = useMemo(
    () =>
      props.dashboardItems.map((item) => ({
        i: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        // Prevents accidental duplication during resize
        isDraggable: props.isEditing,
        isResizable: props.isEditing,
      })),
    [props.dashboardItems, props.isEditing]
  );

  // Handle layout changes from react-grid-layout
  const onLayoutChange = useCallback(
    (newLayout: any[]) => {
      // Only update if there's actually a change to prevent loops
      const hasChanges = newLayout.some((newItem) => {
        const oldItem = props.dashboardItems.find(
          (item) => item.id === newItem.i
        );
        return (
          !oldItem ||
          oldItem.x !== newItem.x ||
          oldItem.y !== newItem.y ||
          oldItem.w !== newItem.w ||
          oldItem.h !== newItem.h
        );
      });

      if (hasChanges) {
        const updatedItems = props.dashboardItems.map((item) => {
          const layoutItem = newLayout.find((l: any) => l.i === item.id);
          return layoutItem
            ? {
                ...item,
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h,
              }
            : item;
        });
        props.setDashboardItems(updatedItems);
      }
    },
    [props.dashboardItems, props.setDashboardItems]
  );

  const onDelete = useCallback(
    (id: string) => {
      const itemToRemove = props.dashboardItems.find((item) => item.id === id);
      if (itemToRemove) {
        // Remove the item from dashboard
        props.setDashboardItems(
          props.dashboardItems.filter((item) => item.id !== id)
        );
      }
    },
    [props.dashboardItems, props.setDashboardItems]
  );

  // Handle drops from the sidebar to the grid
  const onDrop = useCallback(
    (layout: any[], item: any, e: DragEvent) => {
      e.preventDefault();
      setDragOverIndicator(false);

      const blockId = e.dataTransfer?.getData("text/plain");
      if (!blockId || !props.draggingBlock) return;

      // Find the block to get its type
      const block = props.blocks.find((b) => b.id === blockId);
      if (!block) return;

      // Get default size based on block type
      const defaultSize = getDefaults(block.type);
      const mins = getMins(block.type);

      // Create a new dashboard item at the drop position
      const newItem: DashboardItem = {
        id: uuidv4(),
        blockId,
        x: Math.min(item.x, COLS_COUNT - defaultSize.w), // Ensure it stays within grid
        y: item.y,
        w: defaultSize.w,
        h: defaultSize.h,
        minW: mins.minW,
        minH: mins.minH,
      };

      props.setDashboardItems([...props.dashboardItems, newItem]);
    },
    [
      props.draggingBlock,
      props.dashboardItems,
      props.setDashboardItems,
      props.blocks,
    ]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndicator(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOverIndicator(false);
  }, []);

  const onWidthChange = useCallback((width: number) => {
    setGridWidth(width);
  }, []);

  const children = layout.map((item) => {
    const dashboardItem = props.dashboardItems.find((di) => di.id === item.i);
    const block = props.blocks.find((b) => b.id === dashboardItem?.blockId);

    return (
      <div key={item.i} data-block-type={block?.type} className="block-wrapper">
        <div className="bg-white rounded-md h-full shadow-md">
          <GridElement
            item={item}
            block={block}
            onDelete={onDelete}
            isEditingDashboard={props.isEditing}
            latestBlockId={props.latestBlockId}
            dashboardItem={dashboardItem}
            blocks={props.blocks}
            setBlocks={props.setBlocks}
            layouts={[]}
            setLayouts={function (layouts: Layout[]): void {
              throw new Error("Function not implemented.");
            }}
          />
        </div>
      </div>
    );
  });

  // Create grid background style for editing mode
  const style = props.isEditing
    ? {
        backgroundImage: generateBackground(gridWidth),
        backgroundRepeat: "repeat-y",
        minHeight: 800,
      }
    : {};

  return (
    <div
      className={clsx(
        "dashboard-container px-4 py-6 transition-all duration-200",
        props.className,
        dragOverIndicator && "bg-blue-50 border-2 border-dashed border-blue-300"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        setDragOverIndicator(false);
        // This is just for the container drop effect, actual item drop is handled by onDrop
      }}
    >
      <ResponsiveGridLayout
        className="layout"
        rowHeight={ROW_HEIGHT}
        layouts={{ lg: layout }}
        breakpoints={BREAKPOINTS}
        cols={BREAKPOINT_COLS}
        margin={[MARGIN, MARGIN]}
        containerPadding={[MARGIN, MARGIN]}
        onLayoutChange={onLayoutChange}
        onWidthChange={onWidthChange}
        isDraggable={props.isEditing}
        isDroppable={props.isEditing}
        isResizable={props.isEditing}
        resizeHandles={["se"]} // Only allow southeast resize to prevent confusion
        onDrop={onDrop}
        style={style}
        draggableCancel=".grid-element-button"
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
}
