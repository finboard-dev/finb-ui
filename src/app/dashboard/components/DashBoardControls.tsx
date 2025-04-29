"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { Block, DraggingBlock, DashboardItem } from "../page";
import { clsx } from "@/lib/utils";
import { Tab } from "@headlessui/react";

interface Props {
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  onDragStart: (draggingBlock: DraggingBlock) => void;
  onAddBlock: (blockId: string) => void;
  dashboardItems: DashboardItem[];
  setDashboardItems: (items: DashboardItem[]) => void;
}

function BlockListItem({
  block,
  onDragStart,
}: {
  block: Block;
  onDragStart: (draggingBlock: DraggingBlock) => void;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Function to render preview based on block type
  const renderPreview = () => {
    switch (block.type) {
      case "Visualization":
        // case "graph":
        return (
          <div className="bg-gray-50 h-28 rounded p-2 overflow-hidden">
            <div className="text-xs text-gray-500">Graph visualization</div>
            <div className="flex items-center justify-center h-20">
              <svg
                className="w-16 h-16 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
          </div>
        );
      case "SQL":
        // case "table":
        return (
          <div className="bg-gray-50 h-28 rounded p-2 overflow-hidden">
            <div className="text-xs text-gray-500">Table data</div>
            <div className="mt-2 border border-gray-300 rounded">
              <div className="bg-gray-100 px-2 py-1 text-xs font-medium border-b border-gray-300">
                Table Preview
              </div>
              <div className="grid grid-cols-3 gap-x-1 px-2 py-1 text-xs">
                <div>Col 1</div>
                <div>Col 2</div>
                <div>Col 3</div>
              </div>
              <div className="grid grid-cols-3 gap-x-1 px-2 py-1 text-xs border-t border-gray-200">
                <div>Data</div>
                <div>Data</div>
                <div>Data</div>
              </div>
            </div>
          </div>
        );
      case "Python":
        // case "code":
        return (
          <div className="bg-gray-50 h-28 rounded p-2 overflow-hidden text-xs font-mono text-gray-600">
            <pre className="overflow-hidden">
              {typeof block.content === "string" && block.content.length > 100
                ? block.content.substring(0, 100) + "..."
                : block.content}
            </pre>
          </div>
        );
      case "DashboardHeader":
        return (
          <div className="bg-gray-50 h-28 rounded p-2 overflow-hidden">
            <div className="text-md font-semibold text-gray-700">
              {block.title || "Untitled"}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 h-28 rounded p-2 overflow-hidden text-xs text-gray-500">
            {typeof block.content === "string" && block.content.length > 100
              ? block.content.substring(0, 100) + "..."
              : block.content}
          </div>
        );
    }
  };

  const onDragStartHandler = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const width = blockRef.current?.offsetWidth ?? 0;
      const height = blockRef.current?.offsetHeight ?? 0;
      event.dataTransfer.setData("text/plain", block.id);
      onDragStart({ id: block.id, type: block.type, width, height });
      setIsDragging(true);
    },
    [block.id, block.type, onDragStart]
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={clsx(
        "border border-gray-300 hover:border-blue-200 rounded-md bg-white p-2 mt-4 relative",
        isDragging ? "opacity-50 border-blue-400" : ""
      )}
      draggable={true}
      onDragStart={onDragStartHandler}
      onDragEnd={onDragEnd}
      ref={blockRef}
    >
      <div className="flex flex-col gap-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm font-medium truncate max-w-[200px]">
            {block.title || "Untitled"}
          </span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
            {block.type}
          </span>
        </div>
        {renderPreview()}
      </div>
      <div className="absolute top-0 bottom-0 left-0 right-0 hover:bg-blue-100/50 hover:cursor-grab flex items-center justify-center">
        <span className="text-blue-600 font-medium opacity-0 hover:opacity-100 transition-opacity">
          Drag to dashboard
        </span>
      </div>
    </div>
  );
}

export default function DashboardControls(props: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [savedBlocks, setSavedBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // Load saved blocks from localStorage on mount
  useEffect(() => {
    try {
      const storedBlocks = localStorage.getItem("dashboardBlocks");
      if (storedBlocks) {
        const parsedBlocks = JSON.parse(storedBlocks);
        setSavedBlocks(parsedBlocks);

        // Merge with existing blocks avoiding duplicates
        const existingIds = props.blocks.map((block) => block.id);
        const newBlocks = parsedBlocks.filter(
          (block: Block) => !existingIds.includes(block.id)
        );

        if (newBlocks.length > 0) {
          props.setBlocks([...props.blocks, ...newBlocks]);
        }
      }
    } catch (error) {
      console.error("Error loading saved blocks:", error);
    }
  }, []);

  const addHeading = useCallback(() => {
    const blockId = uuidv4();
    const newBlock: Block = {
      id: blockId,
      type: "DashboardHeader",
      title: "New Heading",
      content: "New Dashboard Section",
    };
    props.setBlocks([...props.blocks, newBlock]);
    props.onAddBlock(blockId);
  }, [props.blocks, props.setBlocks, props.onAddBlock]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const blockId = e.dataTransfer.getData("text/plain");
      const dashboardItemId = e.dataTransfer.getData(
        "application/dashboard-item"
      );
      if (dashboardItemId) {
        // Remove item from dashboard
        props.setDashboardItems(
          props.dashboardItems.filter((item) => item.id !== dashboardItemId)
        );
      }
    },
    [props.setDashboardItems, props.dashboardItems]
  );

  const clearSavedBlocks = useCallback(() => {
    try {
      localStorage.removeItem("dashboardBlocks");
      setSavedBlocks([]);
      // Filter out saved blocks from props.blocks
      const defaultBlocks = props.blocks.filter(
        (block) => !savedBlocks.some((savedBlock) => savedBlock.id === block.id)
      );
      props.setBlocks(defaultBlocks);
    } catch (error) {
      console.error("Error clearing saved blocks:", error);
    }
  }, [props.blocks, props.setBlocks, savedBlocks]);

  if (!isOpen) {
    return (
      <div className="pt-3 fixed right-0 z-10">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white flex items-center rounded-l-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 border border-r-0 border-gray-200 shadow-sm"
        >
          <ChevronDoubleRightIcon className="w-4 h-4" />
          <span className="ml-2">Show Blocks</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "w-[350px] h-full bg-white border-l border-gray-200 flex flex-col shadow-md z-10",
        dragOver && "bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-gray-50 border-b border-gray-200 py-4 px-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Block Library</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronDoubleLeftIcon className="w-4 h-4" />
          <span className="ml-1">Hide</span>
        </button>
      </div>

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex p-2 border-b border-gray-200 bg-gray-50">
          <Tab
            className={({ selected }) =>
              clsx(
                "w-full py-2 text-sm font-medium rounded-md",
                selected
                  ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )
            }
          >
            Default Blocks
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                "w-full py-2 text-sm font-medium rounded-md ml-2",
                selected
                  ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )
            }
          >
            Saved Components
          </Tab>
        </Tab.List>

        <Tab.Panels className="flex-1 overflow-y-auto">
          <Tab.Panel className="p-3">
            {props.blocks
              .filter(
                (block) => !savedBlocks.some((saved) => saved.id === block.id)
              )
              .map((block) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  onDragStart={props.onDragStart}
                />
              ))}
          </Tab.Panel>
          <Tab.Panel className="p-3">
            {savedBlocks.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Saved Components
                  </h3>
                  <button
                    onClick={clearSavedBlocks}
                    className="text-xs flex items-center text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-3 h-3 mr-1" />
                    Clear All
                  </button>
                </div>

                {savedBlocks.map((block) => (
                  <BlockListItem
                    key={block.id}
                    block={block}
                    onDragStart={props.onDragStart}
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                <p className="mb-2">No saved components yet</p>
                <p className="text-sm">
                  Save components from the response panel to see them here
                </p>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <button
          className="flex items-center rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 w-full bg-white shadow-sm justify-center"
          onClick={addHeading}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          <span>Add heading</span>
        </button>
      </div>
    </div>
  );
}
