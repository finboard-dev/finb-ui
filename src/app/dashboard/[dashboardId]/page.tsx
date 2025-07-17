"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
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
import { Sidebar } from "@/components/ui/common/sidebar";
import { CompanyModal } from "@/components/ui/common/CompanyModal";
import GlobalLoading from "@/components/ui/common/GlobalLoading";
import { saveDashboard } from "@/lib/api/dashboard";

/**
 * Parses the widget data from the API into the format expected by the GridElement component.
 * @param output - The output data from the API widget.
 * @param outputType - The type of the widget ('GRAPH', 'TABLE', 'KPI').
 * @returns The processed content for the Block.
 */
function parseWidgetData(
  output: string,
  outputType: "GRAPH" | "TABLE" | "KPI"
): any {
  // Handle null or undefined data (widget data is fetched separately)
  if (!output) {
    console.warn("Widget output is null or undefined - may still be loading");
    return null;
  }

  if (outputType === "GRAPH" && typeof output === "string") {
    try {
      return JSON.parse(output);
    } catch (e) {
      console.error("Failed to parse graph data:", e);
      return { error: "Invalid JSON format" };
    }
  }
  // For tables, we will pass the HTML string directly. GridElement will handle it.
  // For KPIs, the data is already in a compatible object format.
  return output;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.dashboardId as string;
  const dispatch = useAppDispatch();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, "sidebar-chat")
  );
  const isSidebarCollapsed = !isSidebarOpen;

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

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: "sidebar",
        id: "sidebar-chat",
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

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

  // Transform widgets to blocks and dashboard items when currentTabWidgets change
  useEffect(() => {
    if (!currentTabWidgets || currentTabWidgets.length === 0) return;

    const newBlocks: Block[] = [];
    const newDashboardItems: DashboardItem[] = [];

    currentTabWidgets.forEach((widget) => {
      // Create a Block definition from the widget
      const block: Block = {
        id: widget.refId,
        title: widget.title,
        subtitle: "", // Default subtitle since it's not in Widget type
        type: widget.outputType,
        filter: {}, // Filter is not in the new widget structure
        content: parseWidgetData(widget.output, widget.outputType),
      };
      newBlocks.push(block);

      // Create a DashboardItem for the grid layout from the widget
      const item: DashboardItem = {
        id: widget.id,
        blockId: widget.refId,
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

  const handleSaveDashboard = async () => {
    if (!structure || !currentVersion || currentVersion !== "draft") {
      toast.error("Cannot save: not in draft mode or no structure available");
      return;
    }

    try {
      // Map all tabs with their widgets
      const tabs = structure.tabs.map((tab) => {
        if (tab.id === currentTabId) {
          // For the current tab, use ALL dashboardItems (current state after drag/drop/resize)
          // This handles: new components from sidebar, deleted components, moved components
          const widgets = dashboardItems
            .map((item) => {
              // Find the corresponding widget in the current tab (for existing widgets)
              const existingWidget = tab.widgets.find((w) => w.id === item.id);

              if (existingWidget) {
                // This is an existing widget - use its metadata but update position
                return {
                  id: existingWidget.id,
                  title: existingWidget.title,
                  position: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                    min_w: item.minW,
                    min_h: item.minH,
                  },
                  refId: existingWidget.refId,
                  refVersion: existingWidget.refVersion,
                  refType: existingWidget.refType,
                  outputType: existingWidget.outputType,
                };
              } else {
                // This is a new widget from sidebar - create new widget data
                // Find the block to get metadata from viewBlocks OR apiComponents (sidebar components)
                const block =
                  viewBlocks.find((b) => b.id === item.blockId) ||
                  apiComponents.find((b) => b.id === item.blockId);
                if (!block) {
                  console.warn(
                    `Block not found for item ${item.id} with blockId ${item.blockId}`
                  );
                  console.log("Available blocks:", {
                    viewBlocks: viewBlocks.map((b) => ({
                      id: b.id,
                      title: b.title,
                    })),
                    apiComponents: apiComponents.map((b) => ({
                      id: b.id,
                      title: b.title,
                    })),
                  });
                  return null;
                }

                return {
                  id: item.id, // Use the dashboard item ID
                  title: block.title,
                  position: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                    min_w: item.minW,
                    min_h: item.minH,
                  },
                  refId: block.id, // Use the block ID as refId
                  refVersion: "1.0.0", // Default version for new components
                  refType: "COMPONENT", // Default type for new components
                  outputType: block.type, // Use the block type
                };
              }
            })
            .filter(
              (widget): widget is NonNullable<typeof widget> => widget !== null
            ); // Remove any null entries

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: widgets,
          };
        } else {
          // For other tabs, use the original widget data
          const widgets = tab.widgets.map((widget) => ({
            id: widget.id,
            title: widget.title,
            position: {
              x: widget.position.x,
              y: widget.position.y,
              w: widget.position.w,
              h: widget.position.h,
              min_w: widget.position.minW,
              min_h: widget.position.minH,
            },
            refId: widget.refId,
            refVersion: widget.refVersion,
            refType: widget.refType,
            outputType: widget.outputType,
          }));

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: widgets,
          };
        }
      });

      // Prepare the save request
      const saveRequest = {
        id: structure.draftVersion?.id || structure.uid, // Use draftVersion.id as specified
        dashboardId: dashboardId, // Add the dashboard ID
        tabs: tabs,
      };

      console.log("Saving dashboard with data:", saveRequest);

      // Call the save API
      await saveDashboard(saveRequest);

      toast.success(`Dashboard "${structure.title}" saved successfully!`);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast.error("Failed to save dashboard");
    }
  };

  const handleSaveDraft = async () => {
    // Use the same logic as handleSaveDashboard to save with the new API
    if (!structure || !currentVersion || currentVersion !== "draft") {
      toast.error("Cannot save: not in draft mode or no structure available");
      return;
    }

    try {
      // Map all tabs with their widgets
      const tabs = structure.tabs.map((tab) => {
        if (tab.id === currentTabId) {
          // For the current tab, use ALL dashboardItems (current state after drag/drop/resize)
          // This handles: new components from sidebar, deleted components, moved components
          const widgets = dashboardItems
            .map((item) => {
              // Find the corresponding widget in the current tab (for existing widgets)
              const existingWidget = tab.widgets.find((w) => w.id === item.id);

              if (existingWidget) {
                // This is an existing widget - use its metadata but update position
                return {
                  id: existingWidget.id,
                  title: existingWidget.title,
                  position: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                    min_w: item.minW,
                    min_h: item.minH,
                  },
                  refId: existingWidget.refId,
                  refVersion: existingWidget.refVersion,
                  refType: existingWidget.refType,
                  outputType: existingWidget.outputType,
                };
              } else {
                // This is a new widget from sidebar - create new widget data
                // Find the block to get metadata from viewBlocks OR apiComponents (sidebar components)
                const block =
                  viewBlocks.find((b) => b.id === item.blockId) ||
                  apiComponents.find((b) => b.id === item.blockId);
                if (!block) {
                  console.warn(
                    `Block not found for item ${item.id} with blockId ${item.blockId}`
                  );
                  console.log("Available blocks:", {
                    viewBlocks: viewBlocks.map((b) => ({
                      id: b.id,
                      title: b.title,
                    })),
                    apiComponents: apiComponents.map((b) => ({
                      id: b.id,
                      title: b.title,
                    })),
                  });
                  return null;
                }

                return {
                  id: item.id, // Use the dashboard item ID
                  title: block.title,
                  position: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                    min_w: item.minW,
                    min_h: item.minH,
                  },
                  refId: block.id, // Use the block ID as refId
                  refVersion: "1.0.0", // Default version for new components
                  refType: "COMPONENT", // Default type for new components
                  outputType: block.type, // Use the block type
                };
              }
            })
            .filter(
              (widget): widget is NonNullable<typeof widget> => widget !== null
            ); // Remove any null entries

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: widgets,
          };
        } else {
          // For other tabs, use the original widget data
          const widgets = tab.widgets.map((widget) => ({
            id: widget.id,
            title: widget.title,
            position: {
              x: widget.position.x,
              y: widget.position.y,
              w: widget.position.w,
              h: widget.position.h,
              min_w: widget.position.minW,
              min_h: widget.position.minH,
            },
            refId: widget.refId,
            refVersion: widget.refVersion,
            refType: widget.refType,
            outputType: widget.outputType,
          }));

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: widgets,
          };
        }
      });

      // Prepare the save request
      const saveRequest = {
        id: structure.draftVersion?.id || structure.uid, // Use draftVersion.id as specified
        dashboardId: dashboardId, // Add the dashboard ID
        tabs: tabs,
      };

      console.log("Saving dashboard with data:", saveRequest);

      // Call the save API
      await saveDashboard(saveRequest);

      toast.success("Draft saved successfully");
    } catch (error) {
      console.error("Error saving dashboard:", error);
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
    return <GlobalLoading message="Loading Dashboard..." />;
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
      {!structure.view_only && (
        <Sidebar
          onClickSettings={() => router.push("/dashboard/settings")}
          isCollapsed={isSidebarCollapsed}
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
      <CompanyModal />
    </div>
  );
}
