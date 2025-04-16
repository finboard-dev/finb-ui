"use client";

import { useCallback, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Block, BlockType, DashboardItem } from "../page";

interface Props {
  item: any;
  block: Block | undefined;
  onDelete: (id: string) => void;
  isEditingDashboard: boolean;
  latestBlockId: string | null;
  dashboardItem?: DashboardItem;
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
}

const NO_TITLE_BLOCKS: BlockType[] = ["Input", "RichText", "DashboardHeader"];

export default function GridElement(props: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const onDelete = useCallback(() => {
    props.onDelete(props.item.i);
  }, [props.onDelete, props.item.i]);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!props.block) return;

      // Instead of changing the HTML drag ghost, set data for the parent component
      e.dataTransfer.setData("text/plain", props.block.id);
      e.dataTransfer.setData("application/dashboard-item", props.item.i);
      e.dataTransfer.effectAllowed = "move";

      // Add visual cue
      setIsDragging(true);

      // Let the event bubble up to the parent for handling the actual drag operation
      // This prevents issues with react-grid-layout's drag handling
    },
    [props.block, props.item.i]
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const hasTitle =
    props.block &&
    !NO_TITLE_BLOCKS.includes(props.block.type) &&
    props.block.title.trim() !== "";

  return (
    <div
      className={clsx(
        "element-container relative group h-full w-full",
        props.isEditingDashboard && "cursor-grab",
        isDragging && "opacity-50"
      )}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {props.block ? (
        <div className="w-full h-full rounded-md overflow-hidden flex flex-col border border-gray-200">
          {hasTitle && (
            <div className="element-header bg-gray-50 border-b border-gray-200">
              <h2 className="text-gray-700 font-medium text-left text-sm px-3.5 py-2.5">
                {props.block.title}
              </h2>
            </div>
          )}
          <div className="element-content flex-grow overflow-auto p-3">
            <div className="bg-gray-50 h-full rounded p-2">
              {props.block.content}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
          Empty block ({props.item.i})
        </div>
      )}

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
            onClick={onDelete}
            title="Move to sidebar"
          >
            <ArrowLeftIcon />
          </button>
        </div>
      )}

      {props.isEditingDashboard && (
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-gray-400 opacity-50 group-hover:opacity-100 pointer-events-none" />
      )}
    </div>
  );
}
