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
  BarChart3Icon,
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import {
  selectSelectedOrganization,
  selectSelectedCompany,
} from "@/lib/store/slices/userSlice";
import { getComponentMetrics } from "@/lib/api/metrics";

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

    // For tables, show a preview of the HTML table if available
    if (b.type === "table" && b.htmlTable) {
      return (
        <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md overflow-hidden relative border-b border-slate-200">
          <div
            className="w-full h-full p-2 overflow-hidden text-xs"
            style={{
              fontSize: "10px",
              lineHeight: "1.2",
            }}
            dangerouslySetInnerHTML={{
              __html: b.htmlTable
                .replace(
                  /<table/g,
                  '<table style="width: 100%; max-width: 100%; font-size: 10px; border-collapse: collapse;"'
                )
                .replace(
                  /<th/g,
                  '<th style="padding: 2px 4px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"'
                )
                .replace(
                  /<td/g,
                  '<td style="padding: 2px 4px; border: 1px solid #e5e7eb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"'
                ),
            }}
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

      // For tables, pass the html_table as content
      const dragData = {
        id: block.id,
        type: block.type,
        width,
        height,
        htmlTable: block.htmlTable, // Pass HTML table data for table renderer
      };

      onDragStart(dragData);
      setIsDragging(true);
    },
    [block.id, block.type, block.htmlTable, onDragStart]
  );

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  return (
    <Card
      ref={blockRef}
      className={cn(
        "mb-3 w-full max-w-full bg-white hover:shadow-xl transition-all duration-200 group relative border-gray-200 hover:border-blue-500/50",
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
        <div className="flex justify-between items-center w-full min-w-0">
          <CardTitle
            className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0 mr-2"
            title={block.title || "Untitled"}
          >
            {block.title || "Untitled"}
          </CardTitle>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200 flex-shrink-0 capitalize whitespace-nowrap">
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
  onApiComponentsLoaded?: (components: Block[]) => void;
}

export default function DashboardControls({
  blocks,
  onDragStart,
  onApiComponentsLoaded,
}: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeViewFilter, setActiveViewFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("my-components");
  const [globalComponents, setGlobalComponents] = useState<Block[]>([]);
  const [myComponents, setMyComponents] = useState<Block[]>([]);
  const [loadingGlobalComponents, setLoadingGlobalComponents] = useState(false);

  // Get organization and company data from Redux
  const selectedOrganization = useAppSelector(selectSelectedOrganization);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  console.log("Redux state:", {
    selectedOrganization: selectedOrganization?.id,
    selectedCompany: selectedCompany?.id,
    hasOrg: !!selectedOrganization,
    hasCompany: !!selectedCompany,
  });

  // Fetch all components from API
  const fetchAllComponents = useCallback(async () => {
    console.log("fetchAllComponents called with:", {
      orgId: selectedOrganization?.id,
      companyId: selectedCompany?.id,
      hasOrg: !!selectedOrganization,
      hasCompany: !!selectedCompany,
    });

    if (!selectedOrganization?.id || !selectedCompany?.id) {
      console.warn("Organization or Company not selected");
      return;
    }

    setLoadingGlobalComponents(true);
    try {
      console.log("Making API call to getComponentMetrics...");
      const response = await getComponentMetrics({
        orgId: selectedOrganization.id,
        companyId: selectedCompany.id,
        publishedOnly: true,
      });

      console.log("API Response:", {
        success: response.success,
        dataLength: response.data?.length,
        data: response.data,
      });

      if (response.success && response.data) {
        // Transform API response to Block format and separate by scope
        const globalBlocks: Block[] = [];
        const myBlocks: Block[] = [];

        response.data.forEach((metric: any) => {
          console.log("Processing metric:", {
            id: metric.id,
            title: metric.title,
            scope_level: metric.scope_level,
            type: metric.type,
            hasHtmlTable: !!metric.published_version?.html_table,
          });

          const block: Block = {
            id: metric.id || `metric-${Date.now()}-${Math.random()}`,
            component_id: metric.componentId || metric.id,
            title: metric.title || "Untitled Metric",
            subtitle: metric.subtitle || "",
            type: getComponentType(metric), // Use smart type detection
            filter: metric.filter || {},
            // Map the content properly based on type
            content:
              getComponentType(metric) === "table"
                ? metric.published_version?.html_table || ""
                : getComponentType(metric) === "graph"
                ? metric.published_version?.table_data || {}
                : {
                    // For metrics, create a simple metric structure
                    value:
                      metric.published_version?.table_data?.rows?.[0]
                        ?.values?.[0] || 0,
                    change: 0,
                    changeLabel: "vs last period",
                  },
            previewImage: metric.previewImage,
            // Add the html_table for table rendering
            htmlTable: metric.published_version?.html_table,
            scopeLevel: metric.scope_level,
          };

          console.log("Created block:", {
            title: block.title,
            type: block.type,
            scopeLevel: block.scopeLevel,
            hasContent: !!block.content,
            contentType: typeof block.content,
            contentPreview:
              typeof block.content === "string"
                ? block.content.substring(0, 100) + "..."
                : JSON.stringify(block.content).substring(0, 100) + "...",
          });

          // Separate by scope level
          if (metric.scope_level === "global") {
            console.log("Adding to global blocks:", block.title);
            globalBlocks.push(block);
          } else {
            console.log("Adding to my blocks:", block.title);
            myBlocks.push(block);
          }
        });

        console.log("Final counts:", {
          globalBlocks: globalBlocks.length,
          myBlocks: myBlocks.length,
          totalFromAPI: response.data.length,
        });

        setGlobalComponents(globalBlocks);
        setMyComponents(myBlocks);

        // Notify parent component about all available components
        const allApiComponents = [...globalBlocks, ...myBlocks];
        if (onApiComponentsLoaded) {
          onApiComponentsLoaded(allApiComponents);
        }
      }
    } catch (error: any) {
      console.error("Error fetching components:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      toast.error("Failed to fetch components from API");
    } finally {
      setLoadingGlobalComponents(false);
    }
  }, [selectedOrganization?.id, selectedCompany?.id]);

  // Log component mount and Redux state changes
  useEffect(() => {
    console.log("DashboardControls mounted/updated:", {
      activeTab,
      orgId: selectedOrganization?.id,
      companyId: selectedCompany?.id,
      hasOrg: !!selectedOrganization,
      hasCompany: !!selectedCompany,
    });
  }, [selectedOrganization, selectedCompany]);

  // Fetch all components when tab changes or when org/company changes
  useEffect(() => {
    console.log("Tab changed or dependencies updated:", {
      activeTab,
      orgId: selectedOrganization?.id,
      companyId: selectedCompany?.id,
    });

    if (activeTab === "global-components" || activeTab === "my-components") {
      console.log("Fetching components for tab:", activeTab);
      fetchAllComponents();
    }
  }, [activeTab, fetchAllComponents]);

  // Helper function to detect if content is a table
  const isTableContent = (content: any): boolean => {
    if (typeof content === "string") {
      return (
        content.includes("<table") ||
        content.includes("<tr") ||
        content.includes("<td")
      );
    }
    return false;
  };

  // Helper function to determine component type
  const getComponentType = (metric: any): "metric" | "graph" | "table" => {
    // If it has html_table, it's a table
    if (metric.published_version?.html_table) {
      return "table";
    }

    // If it has python_code that creates charts/graphs, it's a graph
    if (metric.published_version?.python_code) {
      const pythonCode = metric.published_version.python_code
        .join(" ")
        .toLowerCase();
      if (
        pythonCode.includes("chart") ||
        pythonCode.includes("plot") ||
        pythonCode.includes("graph")
      ) {
        return "graph";
      }
    }

    // Default to metric
    return "metric";
  };

  // Filtering logic based on search and type filters
  const filterAndSearchBlocks = (blocksToFilter: Block[]): Block[] => {
    let filtered = blocksToFilter;
    console.log("Filtering blocks:", {
      totalBlocks: blocksToFilter.length,
      activeViewFilter,
      searchQuery,
      blockTypes: blocksToFilter.map((b) => ({ title: b.title, type: b.type })),
    });

    if (activeViewFilter) {
      if (activeViewFilter === "metric") {
        // Show both metric and table types under "Metric" filter
        filtered = filtered.filter(
          (b) => b.type === "metric" || b.type === "table"
        );
        console.log("After metric filter:", filtered.length);
      } else {
        filtered = filtered.filter((b) => b.type === activeViewFilter);
        console.log("After type filter:", filtered.length);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter((b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log("After search filter:", filtered.length);
    }

    return filtered;
  };

  // Combine API my components with prop blocks for the my-components tab
  const allMyComponents = [...blocks, ...myComponents];
  const displayComponents = filterAndSearchBlocks(allMyComponents);
  const displayGlobalComponents = filterAndSearchBlocks(globalComponents);

  console.log("Display state:", {
    activeTab,
    activeViewFilter,
    searchQuery,
    globalComponentsCount: globalComponents.length,
    myComponentsCount: myComponents.length,
    displayGlobalComponentsCount: displayGlobalComponents.length,
    displayComponentsCount: displayComponents.length,
  });

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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-grow min-h-0"
      >
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="my-components" className="text-xs">
              My Components
            </TabsTrigger>
            <TabsTrigger value="global-components" className="text-xs">
              Global Components
            </TabsTrigger>
          </TabsList>

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

          <div className="grid grid-cols-2 gap-2 items-center justify-start w-full">
            {[
              { label: "Metric", value: "metric", icon: TrendingUpIcon },
              { label: "Graph", value: "graph", icon: LayoutGridIcon },
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

        <TabsContent
          value="my-components"
          className="flex-1 min-h-0 m-0 overflow-hidden"
        >
          <ScrollArea className="h-full">
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
        </TabsContent>

        <TabsContent
          value="global-components"
          className="flex-1 min-h-0 m-0 overflow-hidden"
        >
          <ScrollArea className="h-full">
            <div className="p-3">
              {loadingGlobalComponents ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-sm text-slate-500">
                    Loading global components...
                  </div>
                </div>
              ) : displayGlobalComponents.length > 0 ? (
                displayGlobalComponents.map((block) => (
                  <BlockListItem
                    key={block.id}
                    block={block}
                    onDragStart={onDragStart}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <BarChart3Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-2">
                    No global components found.
                  </p>
                  <p className="text-xs text-slate-400">
                    {!selectedOrganization || !selectedCompany
                      ? "Please select an organization and company to view global components."
                      : "Published global components will appear here."}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="h-10 flex-shrink-0 bg-slate-50 border-t border-slate-200"></div>
    </aside>
  );
}
