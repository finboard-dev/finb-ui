"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardSpecificHeader from "../components/ui/Header";
import DashboardControls from "../components/Dashboard/DashBoardControls";
import DashboardView from "../components/Dashboard/DashboardView";
import {
  DashboardLoading,
  DashboardError,
} from "../components/ui/DashboardLoading";

import { toast } from "sonner";
import type { Block, DashboardItem, DraggingBlock } from "../types";
import { useDashboard } from "../hooks/useDashboard";
import { Sidebar } from "../components/ui/LeftSidebar";

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
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.dashboardId as string;

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
    currentVersion,
    canEdit,
    canPublish,
    switchToDraft,
    switchToPublished,
    saveDraft,
    publishDraft,
  } = useDashboard(dashboardId);

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [viewBlocks, setViewBlocks] = useState<Block[]>([]);
  const [apiComponents, setApiComponents] = useState<Block[]>([]);
  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(
    null
  );

  // Initialize dashboard on component mount or when dashboardId changes
  useEffect(() => {
    console.log(
      "🔄 Dashboard initialization effect triggered with dashboardId:",
      dashboardId
    );

    if (!dashboardId) {
      toast.error("Dashboard ID is required");
      router.push("/dashboard/select");
      return;
    }

    console.log("🚀 Starting dashboard initialization for:", dashboardId);
    initializeDashboard().catch((error) => {
      console.error("Failed to initialize dashboard:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a 404 or not found error
      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("Failed to fetch dashboard structure")
      ) {
        toast.error(
          "Dashboard not found. Redirecting to dashboard selection..."
        );
        setTimeout(() => {
          router.push("/dashboard/select");
        }, 2000);
      } else if (
        errorMessage.includes("Network Error") ||
        errorMessage.includes("fetch")
      ) {
        // Network errors are handled gracefully with mock data
        console.log("Using fallback data due to network error");
      } else {
        toast.error(`Failed to load dashboard: ${errorMessage}`);
      }
    });
  }, [dashboardId, initializeDashboard, router]);

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

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      toast.success("Draft saved successfully");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  };

  const handlePublishDraft = async () => {
    try {
      await publishDraft();
      toast.success("Dashboard published successfully");
    } catch (error) {
      toast.error("Failed to publish dashboard");
    }
  };

  const handleSwitchToDraft = () => {
    switchToDraft();
    toast.info("Switched to draft version");
  };

  const handleSwitchToPublished = () => {
    switchToPublished();
    toast.info("Switched to published version");
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

  const handleLoadDashboard = (newDashboardId: string) => {
    router.push(`/dashboard/${newDashboardId}`);
  };

  const handleNewDashboard = () => {
    // For now, redirect to a default dashboard
    // In a real app, you might want to create a new dashboard ID
    router.push("/dashboard/XERO_DASH_001");
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

  console.log(structure);

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      {!structure.view_only && <Sidebar isCollapsed={false} />}
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
          currentVersion={currentVersion}
          canEdit={canEdit}
          canPublish={canPublish}
          onSaveDraft={handleSaveDraft}
          onPublishDraft={handlePublishDraft}
          onSwitchToDraft={handleSwitchToDraft}
          onSwitchToPublished={handleSwitchToPublished}
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
              blocks={[...viewBlocks, ...apiComponents]}
              draggingBlock={draggingBlock}
              isEditing={isEditing}
            />
            {isEditing && (
              <DashboardControls
                blocks={viewBlocks}
                setBlocks={() => {}}
                onDragStart={setDraggingBlock}
                onApiComponentsLoaded={setApiComponents}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
