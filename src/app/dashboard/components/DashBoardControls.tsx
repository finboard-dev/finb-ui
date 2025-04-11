import { useCallback, useRef, useState } from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { Block, DraggingBlock, DashboardItem } from "../page";
import { clsx } from "@/lib/utils";

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
        "border border-gray-300 hover:border-blue-200 rounded-md bg-white p-2 mt-6 relative",
        isDragging ? "opacity-50 border-blue-400" : ""
      )}
      draggable={true}
      onDragStart={onDragStartHandler}
      onDragEnd={onDragEnd}
      ref={blockRef}
    >
      <div className="flex flex-col gap-y-6">
        <span className="text-gray-400 text-md font-medium">
          {block.title || "Untitled"}
        </span>
        <div className="bg-gray-100 h-32 rounded">{block.content}</div>
      </div>
      <div className="absolute top-0 bottom-0 left-0 right-0 hover:bg-blue-100/50 hover:cursor-grab flex items-center justify-center">
        <span className="text-blue-600 font-medium">Drag to dashboard</span>
      </div>
    </div>
  );
}

export default function DashboardControls(props: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const addHeading = useCallback(() => {
    const blockId = uuidv4();
    const newBlock: Block = {
      id: blockId,
      type: "DashboardHeader",
      title: "New Heading",
      content: "",
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

  if (!isOpen) {
    return (
      <div className="pt-3 fixed right-0">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white flex items-center rounded-l-sm px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 border border-r-0 border-gray-200"
        >
          <ChevronDoubleRightIcon className="w-3 h-3" />
          <span className="ml-2">Show Blocks</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "w-[400px] h-full bg-white border-l border-gray-200 flex flex-col",
        dragOver && "bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-gray-50 border-b border-gray-200 py-6 px-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Blocks</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronDoubleLeftIcon className="w-4 h-4" />
          <span className="ml-1">Hide</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        {props.blocks.map((block) => (
          <BlockListItem
            key={block.id}
            block={block}
            onDragStart={props.onDragStart}
          />
        ))}
      </div>
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <button
          className="flex items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 border border-gray-200 w-full bg-white shadow-sm justify-center"
          onClick={addHeading}
        >
          <span>Add heading</span>
        </button>
      </div>
    </div>
  );
}
