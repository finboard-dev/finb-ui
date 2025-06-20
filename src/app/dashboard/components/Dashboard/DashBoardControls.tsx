"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  LayoutGridIcon,
  Rows3Icon,
  GripVerticalIcon,
  ComponentIcon,
  TrendingUpIcon,
} from "lucide-react";

import type { Block, DraggingBlock } from "../../types";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// (BlockListItem sub-component remains the same as in the original file)
interface BlockListItemProps {
  block: Block;
  onDragStart: (draggingBlock: DraggingBlock) => void;
}

function BlockListItem({ block, onDragStart }: BlockListItemProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const renderPreview = (b: Block) => {
    // This preview logic remains unchanged
    const isValidPreviewImage =
      b.previewImage && b.previewImage.startsWith("data:image/");
    if (isValidPreviewImage) {
      return (
        <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md overflow-hidden relative border-b border-slate-200">
          <img
            src={b.previewImage}
            alt={b.title || "Component Preview"}
            className="w-full h-full object-contain p-2"
          />
        </div>
      );
    }
    let icon = <ComponentIcon className="w-10 h-10 text-slate-400" />;
    if (b.type === "graph")
      icon = <LayoutGridIcon className="w-10 h-10 text-slate-400" />;
    else if (b.type === "table")
      icon = <Rows3Icon className="w-10 h-10 text-slate-400" />;
    else if (b.type === "metric")
      icon = <TrendingUpIcon className="w-10 h-10 text-slate-400" />;

    return (
      <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md flex flex-col items-center justify-center text-slate-500 p-2 text-center border-b border-slate-200">
        {icon}
        <span className="text-xs mt-2 line-clamp-2">
          {b.title || "Untitled Component"}
        </span>
        <span className="text-xs text-slate-400 mt-1">(Preview N/A)</span>
      </div>
    );
  };

  const onDragStartHandler = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const rect = blockRef.current?.getBoundingClientRect();
      const width = rect?.width && rect.width > 50 ? rect.width : 300;
      const height = rect?.height && rect.height > 50 ? rect.height : 180;
      event.dataTransfer.setData("text/plain", block.id);
      event.dataTransfer.effectAllowed = "copy";
      onDragStart({ id: block.id, type: block.type, width, height });
      setIsDragging(true);
    },
    [block.id, block.type, onDragStart]
  );

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  return (
    <Card
      ref={blockRef}
      className={cn(
        "mb-3 bg-white hover:shadow-xl transition-all duration-200 group relative border-gray-200 hover:border-blue-500/50",
        isDragging
          ? "opacity-60 ring-2 ring-blue-600 scale-95 shadow-2xl"
          : "shadow-md",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-grab"
      )}
      draggable={true}
      onDragStart={onDragStartHandler}
      onDragEnd={onDragEnd}
      tabIndex={0}
      aria-label={`Drag component: ${block.title}`}
    >
      {renderPreview(block)}
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <CardTitle
            className="text-sm font-semibold text-gray-800 truncate max-w-[calc(100%-50px)]"
            title={block.title || "Untitled"}
          >
            {block.title || "Untitled"}
          </CardTitle>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200 flex-shrink-0 capitalize">
            {block.type}
          </span>
        </div>
      </CardHeader>
      <div
        className={cn(
          "absolute inset-0 bg-blue-600/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-lg group-focus-visible:opacity-100",
          isDragging && "opacity-100 bg-blue-500/20"
        )}
        aria-hidden="true"
      >
        <div className="text-white bg-blue-600 shadow-lg px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 pointer-events-none">
          <GripVerticalIcon className="w-4 h-4" />
          Drag to dashboard
        </div>
      </div>
    </Card>
  );
}

interface DashboardControlsProps {
  blocks: Block[];
  setBlocks: (blocksUpdater: (prevBlocks: Block[]) => Block[]) => void;
  onDragStart: (draggingBlock: DraggingBlock) => void;
}

export default function DashboardControls({
  blocks,
  onDragStart,
}: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeViewFilter, setActiveViewFilter] = useState<string>("");

  // Filtering logic based on search and type filters
  const filterAndSearchBlocks = (blocksToFilter: Block[]): Block[] => {
    let filtered = blocksToFilter;
    if (activeViewFilter) {
      filtered = filtered.filter((b) => b.type === activeViewFilter);
    }
    return searchQuery
      ? filtered.filter((b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filtered;
  };

  const displayComponents = filterAndSearchBlocks(blocks);

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="bg-white rounded-l-lg rounded-r-none px-2 py-6 text-sm text-slate-600 hover:bg-slate-50 border-slate-300 shadow-lg flex flex-col items-center h-auto gap-1 hover:border-slate-400"
          aria-label="Show components panel"
        >
          <ChevronRightIcon className="w-5 h-5" />
          <span className="[writing-mode:vertical-rl] transform rotate-180 text-xs font-medium tracking-wider uppercase">
            Components
          </span>
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "w-[320px] md:w-[360px] h-[calc(100vh-65px)] bg-white border-l border-gray-200 flex flex-col shadow-2xl z-10 fixed right-0 top-[65px]"
      )}
    >
      <div className="bg-slate-50 border-b border-slate-200 py-4 px-4 flex justify-between items-center h-[65px] flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">Components</h2>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-md"
          aria-label="Hide components panel"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex flex-col flex-grow min-h-0">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="relative mb-2.5">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Find by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 h-9 border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 bg-white placeholder-slate-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center justify-start w-full">
            {[
              { label: "Graph", value: "graph", icon: LayoutGridIcon },
              { label: "Table", value: "table", icon: Rows3Icon },
              { label: "Metric", value: "metric", icon: TrendingUpIcon },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={
                  activeViewFilter === filter.value ? "secondary" : "outline"
                }
                size="sm"
                onClick={() =>
                  setActiveViewFilter((prev) =>
                    prev === filter.value ? "" : filter.value
                  )
                }
                className={cn(
                  "px-2 py-1 h-8 text-xs rounded-md flex items-center justify-center gap-1.5 w-full transition-colors",
                  activeViewFilter === filter.value
                    ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                    : "text-slate-600 bg-white border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                )}
              >
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3">
            {displayComponents.length > 0 ? (
              displayComponents.map((block) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  onDragStart={onDragStart}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-10">
                No components found.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="h-10 flex-shrink-0 bg-slate-50 border-t border-slate-200"></div>
    </aside>
  );
}
