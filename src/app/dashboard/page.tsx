"use client";

import { useEffect, useState } from "react";
import AppSidebar from "./components/ui/LeftSidebar";
import DashboardSpecificHeader from "./components/ui/Header";
import DashboardControls from "./components/Dashboard/DashBoardControls";
import DashboardView from "./components/Dashboard/DashboardView";
import {
  DashboardLoading,
  DashboardError,
} from "./components/ui/DashboardLoading";

import { toast } from "sonner";
import type { Block, DashboardItem, DraggingBlock } from "./types";
import { useDashboard } from "./hooks/useDashboard";

/**
 * Parses the widget data from the API into the format expected by the GridElement component.
 * @param data - The data from the API widget.
 * @param type - The type of the widget ('graph', 'table', 'metric').
 * @returns The processed content for the Block.
 */
function parseWidgetData(data: any, type: "metric" | "graph" | "table"): any {
  // Handle null or undefined data (widget data is fetched separately)
  if (!data) {
    console.warn("Widget data is null or undefined - may still be loading");
    return null;
  }

  if (type === "graph" && typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse graph data:", e);
      return { error: "Invalid JSON format" };
    }
  }
  // For tables, we will pass the HTML string directly. GridElement will handle it.
  // For metrics, the data is already in a compatible object format.
  return data;
}

export default function DashboardPage() {
  const {
    structure,
    currentTabId,
    currentTabWidgets,
    loading,
    error,
    loadedTabs,
    initializeDashboard,
    switchTab,
    isEditing,
    setIsEditing,
  } = useDashboard();

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [viewBlocks, setViewBlocks] = useState<Block[]>([]);
  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(
    null
  );

  // Initialize dashboard on component mount (only once)
  useEffect(() => {
    initializeDashboard().catch((error) => {
      console.error("Failed to initialize dashboard:", error);
    });
  }, []); // Empty dependency array to run only once

  // Transform widgets to blocks and dashboard items when current tab widgets change
  useEffect(() => {
    if (!currentTabWidgets || currentTabWidgets.length === 0) return;

    const newBlocks: Block[] = [];
    const newDashboardItems: DashboardItem[] = [];

    currentTabWidgets.forEach((widget) => {
      // Create a Block definition from the widget
      const block: Block = {
        id: widget.component_id,
        component_id: widget.component_id,
        title: widget.title,
        subtitle: "", // Default subtitle since it's not in Widget type
        type: widget.type,
        filter: widget.filter,
        content: parseWidgetData(widget.data, widget.type),
      };
      newBlocks.push(block);

      // Create a DashboardItem for the grid layout from the widget
      const item: DashboardItem = {
        id: widget.id,
        blockId: widget.component_id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: widget.position.minW,
        minH: widget.position.minH,
      };
      newDashboardItems.push(item);
    });

    // De-duplicate block definitions to have a single source of truth
    const uniqueBlocks = [...new Map(newBlocks.map((b) => [b.id, b])).values()];

    setViewBlocks(uniqueBlocks);
    setDashboardItems(newDashboardItems);
  }, [currentTabWidgets]);

  const handleSaveDashboard = () => {
    toast.success(
      `Dashboard "${structure?.title || "Untitled"}" saved (simulation).`
    );
    setIsEditing(false);
  };

  const handleSetIsEditing = (editing: boolean) => {
    if (structure?.view_only) {
      toast.error("You do not have permission to edit this dashboard.");
      return;
    }
    setIsEditing(editing);
  };

  const handleTabChange = async (tabId: string) => {
    try {
      await switchTab(tabId);
    } catch (error) {
      toast.error(
        `Failed to switch to tab: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Show loading state for dashboard structure
  if (loading.structure) {
    return (
      <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
        <DashboardLoading type="structure" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
        <DashboardError error={error} />
      </div>
    );
  }

  // Show loading state if no structure is available
  if (!structure) {
    return (
      <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
        <DashboardLoading
          type="structure"
          message="Initializing dashboard..."
        />
      </div>
    );
  }

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      {!structure.view_only && (
        <AppSidebar
          savedDashboards={[]}
          onLoadDashboard={() => {}}
          currentDashboardId={null}
          onNewDashboard={() => {}}
          isEditing={isEditing}
        />
      )}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-0">
        <DashboardSpecificHeader
          isEditing={isEditing}
          setIsEditing={handleSetIsEditing}
          onSaveDashboard={handleSaveDashboard}
          currentDashboardName={structure.title}
          isViewOnly={structure.view_only}
          tabs={structure.tabs.map((t) => ({ id: t.id, label: t.title }))}
          activeTab={currentTabId}
          onTabChange={handleTabChange}
          loadedTabs={loadedTabs}
          currentTabLoading={loading.widgetData}
        />

        {/* Show loading state for widget data */}
        {loading.widgetData && (
          <div className="flex-1 flex items-center justify-center">
            <DashboardLoading type="widgetData" />
          </div>
        )}

        {/* Show main dashboard content */}
        {!loading.widgetData && (
          <main className="flex-1 flex flex-row overflow-hidden relative bg-slate-100">
            <DashboardView
              className="flex-grow h-full"
              dashboardItems={dashboardItems}
              setDashboardItems={setDashboardItems}
              blocks={viewBlocks}
              draggingBlock={draggingBlock}
              isEditing={isEditing}
            />
            {isEditing && (
              <DashboardControls
                blocks={viewBlocks}
                setBlocks={() => {}}
                onDragStart={setDraggingBlock}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
