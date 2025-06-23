"use client";

import { useState, useEffect, useCallback } from "react";
import AppSidebar from "./components/ui/LeftSidebar";
import DashboardSpecificHeader from "./components/ui/Header";
import DashboardControls from "./components/Dashboard/DashBoardControls";
import DashboardView from "./components/Dashboard/DashboardView";

import { toast } from "sonner";
import type { Block, DashboardItem, DraggingBlock } from "./types";
import { data as apiData } from "./utils/api.data";
import { DashboardData, Widget, WidgetType } from "./utils/api.types";

/**
 * Parses the widget data from the API into the format expected by the GridElement component.
 * @param data - The data from the API widget.
 * @param type - The type of the widget ('graph', 'table', 'metric').
 * @returns The processed content for the Block.
 */
function parseWidgetData(data: any, type: WidgetType): any {
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [viewBlocks, setViewBlocks] = useState<Block[]>([]);

  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(
    null
  );

  // Initial load of data from the mock API
  useEffect(() => {
    // In a real application, you would fetch this data.
    const data: DashboardData = apiData as any;
    setDashboardData(data);
    // Set mode based on the API flag. `isEditing` is the opposite of `view_only`.
    setIsEditing(!data.view_only);
    // Set the first tab as active by default.
    if (data.tabs && data.tabs.length > 0) {
      setActiveTabId(data.tabs[0].id);
    }
  }, []);

  // This effect runs when the active tab changes, re-rendering the grid.
  useEffect(() => {
    if (!dashboardData || !activeTabId) return;

    const activeTab = dashboardData.tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    // --- Data Transformation Layer: API -> Internal State ---
    const newBlocks: Block[] = [];
    const newDashboardItems: DashboardItem[] = [];

    activeTab.widgets.forEach((widget: Widget) => {
      // Create a Block definition from the widget
      const block: Block = {
        id: widget.component_id, // Use component_id for the block definition
        component_id: widget.component_id,
        title: widget.title,
        subtitle: widget.subtitle,
        type: widget.type,
        filter: widget.filter,
        content: parseWidgetData(widget.data, widget.type),
      };
      newBlocks.push(block);

      // Create a DashboardItem for the grid layout from the widget
      const item: DashboardItem = {
        id: widget.id, // Use widget.id for the unique instance on the grid
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
  }, [dashboardData, activeTabId]);

  const handleSaveDashboard = () => {
    // This function is now a placeholder as per the request to remove localStorage persistence.
    toast.success(
      `Dashboard "${dashboardData?.title || "Untitled"}" saved (simulation).`
    );
    setIsEditing(false); // Switch to view mode after saving
  };

  const handleSetIsEditing = (editing: boolean) => {
    // In a real scenario with a `view_only: false` API response, this would toggle the UI.
    if (dashboardData?.view_only) {
      toast.error("You do not have permission to edit this dashboard.");
      return;
    }
    setIsEditing(editing);
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      {!dashboardData.view_only && (
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
          currentDashboardName={dashboardData.title}
          isViewOnly={dashboardData.view_only}
          tabs={dashboardData.tabs.map((t) => ({ id: t.id, label: t.title }))}
          activeTab={activeTabId}
          onTabChange={setActiveTabId}
        />
        <main className="flex-1 flex flex-row overflow-hidden relative bg-slate-100">
          <DashboardView
            className="flex-grow h-full"
            dashboardItems={dashboardItems}
            setDashboardItems={setDashboardItems}
            blocks={viewBlocks}
            // setBlocks={() => {}} // Removed
            draggingBlock={draggingBlock}
            // onAddBlock={() => {}} // Removed
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
      </div>
    </div>
  );
}
