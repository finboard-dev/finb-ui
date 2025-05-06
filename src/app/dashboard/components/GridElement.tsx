"use client";

import { useCallback, useState, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Block, BlockType, DashboardItem } from "../page";
import dynamic from "next/dynamic";
import GridResizeHandler, { ResizeDirection } from "./GridResizeHandler";
import { Layout } from "react-grid-layout";
import VisualizationView from "@/app/components/visualization/VisualizationView";
import DynamicTable from "@/app/tests/components/DynamicTableRenderer";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  item: any;
  block: Block | undefined;
  onDelete: (id: string) => void;
  isEditingDashboard: boolean;
  latestBlockId: string | null;
  dashboardItem?: DashboardItem;
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  layouts: Layout[];
  setLayouts: (layouts: Layout[]) => void;
}

export default function GridElement(props: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] =
    useState<ResizeDirection | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const onDelete = useCallback(() => {
    props.onDelete(props.item.i);
  }, [props.onDelete, props.item.i]);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!props.block) return;

      e.dataTransfer.setData("text/plain", props.block.id);
      e.dataTransfer.setData("application/dashboard-item", props.item.i);
      e.dataTransfer.effectAllowed = "move";
      setIsDragging(true);
    },
    [props.block, props.item.i]
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback(
    (id: string, direction: ResizeDirection) => {
      setIsResizing(true);
      setResizeDirection(direction);
    },
    []
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  // Render component content based on the block type
  const renderBlockContent = () => {
    if (!props.block) return null;

    try {
      switch (props.block.type) {
        case "Visualization":
          // case "graph":
          const chartData =
            typeof props.block.content === "string"
              ? JSON.parse(props.block.content)
              : props.block.content;
          return <VisualizationView charts={chartData} title="" />;
        case "SQL":
          // case "table":
          const tableData =
            typeof props.block.content === "string"
              ? JSON.parse(props.block.content)
              : props.block.content;
          return (
            <div className="w-full h-full overflow-auto">
              <DynamicTable
                data={tableData}
                isLoading={false}
                error={null}
                />
            </div>
          );
        case "Python":
          return (
            <Editor
              height="100%"
              width="100%"
              language="python"
              theme="vs-light"
              value={props.block.content as string}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          );
        case "DashboardHeader":
          return (
            <h2 className="text-xl font-semibold text-gray-800">
              {props.block.content || props.block.title}
            </h2>
          );
        default:
          return (
            <div className="whitespace-pre-wrap break-words">
              {props.block.content}
            </div>
          );
      }
    } catch (error) {
      console.error("Error rendering block content:", error);
      return (
        <div className="text-red-500">
          Error rendering content: {String(error)}
        </div>
      );
    }
  };

  return (
    <div
      ref={elementRef}
      className={clsx(
        "element-container h-full w-full relative group",
        props.isEditingDashboard && "cursor-move",
        isDragging && "opacity-50",
        isResizing && `resizing-${resizeDirection}`
      )}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={clsx(
          "w-full h-full rounded-md overflow-hidden bg-white",
          props.isEditingDashboard ? "shadow-sm" : "shadow-none"
        )}
      >
        <div className="h-full overflow-auto p-2">{renderBlockContent()}</div>
      </div>

      {/* Editing controls */}
      {props.isEditingDashboard && (
        <div
          className="absolute -top-3 right-3 opacity-0 bg-white group-hover:opacity-100 z-20 border border-gray-200 py-1 rounded-md shadow-sm flex gap-x-3.5 items-center px-3.5 grid-element-button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center cursor-pointer text-gray-500 hover:text-blue-600 h-4 w-4 grid-element-button"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            className="flex items-center cursor-pointer text-gray-500 hover:text-red-600 h-4 w-4 grid-element-button"
            onClick={onDelete}
            title="Delete"
          >
            <TrashIcon />
          </button>
          <button
            className="flex items-center cursor-pointer text-gray-500 hover:text-green-600 h-4 w-4 grid-element-button"
            title="Move to sidebar"
          >
            <ArrowLeftIcon />
          </button>
        </div>
      )}

      {/* Resize handlers for all directions */}
      {props.isEditingDashboard && (
        <GridResizeHandler
          itemId={props.item.i}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
          layouts={props.layouts}
          setLayouts={props.setLayouts}
        />
      )}
    </div>
  );
}
