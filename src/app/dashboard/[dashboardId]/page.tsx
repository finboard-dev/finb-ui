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
import type { Block, DashboardItem, DraggingBlock, Tab } from "../types";
import { useDashboard } from "../hooks/useDashboard";
import { Sidebar } from "@/components/ui/common/sidebar";
import { CompanyModal } from "@/components/ui/common/CompanyModal";
import GlobalLoading from "@/components/ui/common/GlobalLoading";
import { saveDashboard } from "@/lib/api/dashboard";

/**
 * Parses the widget data from the API into the format expected by the GridElement component.
 * @param output
 * @param outputType
 * @returns
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
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsLoaded, setMetricsLoaded] = useState(false);

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

  // Reset metrics loaded state when dashboard changes
  useEffect(() => {
    setMetricsLoaded(false);
    setApiComponents([]);
  }, [dashboardId]);

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
    // Clear dashboard items when switching tabs, even if no widgets
    if (!currentTabWidgets) {
      setViewBlocks([]);
      setDashboardItems([]);
      return;
    }

    // If current tab has no widgets, clear the dashboard
    if (currentTabWidgets.length === 0) {
      setViewBlocks([]);
      setDashboardItems([]);
      return;
    }

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
        refVersion: widget.refVersion, // Include refVersion from widget
        refType: widget.refType, // Include refType from widget
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

    console.log("Transformed widgets to blocks:", {
      originalWidgetsCount: currentTabWidgets.length,
      uniqueBlocksCount: uniqueBlocks.length,
      dashboardItemsCount: newDashboardItems.length,
      blocks: uniqueBlocks.map((b) => ({
        id: b.id,
        title: b.title,
        type: b.type,
        hasContent: !!b.content,
      })),
    });

    setViewBlocks(uniqueBlocks);
    setDashboardItems(newDashboardItems);
  }, [currentTabWidgets]);

  // Determine if we should show edit/view mode based on versioning logic
  const shouldShowEditMode = currentVersion === "draft";
  const shouldShowViewMode = currentVersion === "published";
  const isViewOnlyMode = shouldShowViewMode || !canEdit;

  // Override isEditing based on versioning logic
  const effectiveIsEditing = shouldShowEditMode ? isEditing : false;

  // Load metrics when not in edit mode (DashboardControls not rendered)
  useEffect(() => {
    if (!effectiveIsEditing && !metricsLoaded && !metricsLoading) {
      // If not in edit mode, we still need to load metrics for potential future use
      // This ensures metrics are available when switching to edit mode
      setMetricsLoaded(true); // Mark as loaded to avoid infinite loading
    }
  }, [effectiveIsEditing, metricsLoaded, metricsLoading]);

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
          const updatedWidgets = dashboardItems
            .map((item) => {
              // Search in both viewBlocks and apiComponents to find the block
              const block =
                viewBlocks.find((b) => b.id === item.blockId) ||
                apiComponents.find((b) => b.id === item.blockId);

              if (!block) {
                console.warn(
                  `Block ${item.blockId} not found in viewBlocks or apiComponents`
                );
                console.log("Available blocks:", {
                  viewBlocks: viewBlocks.map((b) => ({
                    id: b.id,
                    title: b.title,
                    type: b.type,
                  })),
                  apiComponents: apiComponents.map((b) => ({
                    id: b.id,
                    title: b.title,
                    type: b.type,
                    refVersion: b.refVersion,
                    refType: b.refType,
                  })),
                  dashboardItems: dashboardItems.map((item) => ({
                    id: item.id,
                    blockId: item.blockId,
                  })),
                });
                return null;
              }

              console.log(`Creating widget for block:`, {
                blockId: item.blockId,
                blockTitle: block.title,
                blockType: block.type,
                blockRefVersion: block.refVersion,
                blockRefType: block.refType,
                hasContent: !!block.content,
              });

              return {
                id: item.id,
                title: block.title,
                position: {
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                  min_w: item.minW,
                  min_h: item.minH,
                },
                refId: item.blockId,
                refVersion: block.refVersion || "latest", // Use block's refVersion if available
                refType: block.refType || "METRIC", // Use block's refType if available
                outputType: block.type as string,
                output: block.content || "", // Include the output data
              };
            })
            .filter(
              (widget): widget is NonNullable<typeof widget> => widget !== null
            );

          return {
            id: tab.id,
            title: tab.title,
            position: tab.position,
            startDate: tab.startDate,
            endDate: tab.endDate,
            widgets: updatedWidgets,
          };
        }
        return {
          id: tab.id,
          title: tab.title,
          position: tab.position,
          startDate: tab.startDate,
          endDate: tab.endDate,
          widgets: tab.widgets.map((widget) => ({
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
          })),
        };
      });

      // Prepare the save request
      const saveRequest = {
        id: structure.draftVersion?.id || structure.uid, // Use draftVersion.id as specified
        dashboardId: dashboardId, // Add the dashboard ID
        tabs: tabs,
      };

      console.log("Saving dashboard with data:", saveRequest);
      console.log("Save details:", {
        dashboardItemsCount: dashboardItems.length,
        viewBlocksCount: viewBlocks.length,
        apiComponentsCount: apiComponents.length,
        currentTabId,
        currentTabWidgetsCount: currentTabWidgets?.length || 0,
      });

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
    // Only allow editing in draft mode
    if (currentVersion !== "draft") {
      toast.error("You can only edit in draft mode.");
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

  const handleTabReorder = (newTabs: { id: string; label: string }[]) => {
    // This would need to be implemented to update the backend
    console.log("Tab reorder:", newTabs);
  };

  const handleAddNewTab = async (tabData: {
    title: string;
    startDate: string;
    endDate: string;
    position: number;
  }) => {
    if (!structure || currentVersion !== "draft") {
      toast.error("Can only add tabs in draft mode");
      return;
    }

    try {
      // Create new tab with the provided data
      const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: tabData.title,
        startDate: tabData.startDate,
        endDate: tabData.endDate,
        position: tabData.position,
        lastRefreshedAt: null,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new tab to the current structure
      const updatedTabs = [...structure.tabs, newTab];

      // Save the updated structure to the backend
      const saveRequest = {
        id: structure.draftVersion?.id || structure.uid,
        dashboardId: dashboardId,
        tabs: updatedTabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          position: tab.position,
          startDate: tab.startDate,
          endDate: tab.endDate,
          widgets:
            tab.id === newTab.id
              ? []
              : tab.widgets.map((widget) => ({
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
                })),
        })),
      };

      await saveDashboard(saveRequest);

      // Switch to the new tab
      await switchTab(newTab.id);

      toast.success("New tab added successfully");
    } catch (error) {
      console.error("Error adding new tab:", error);
      toast.error("Failed to add new tab");
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

  // Show loading state for dashboard structure and metrics
  console.log("Loading states:", {
    structureLoading: loading.structure,
    metricsLoading,
    metricsLoaded,
    hasStructure: !!structure,
    hasError: !!error,
    shouldShowLoading:
      loading.structure ||
      (metricsLoading && !metricsLoaded) ||
      (!structure && !error),
  });

  if (
    loading.structure ||
    (metricsLoading && !metricsLoaded) ||
    (!structure && !error)
  ) {
    return <GlobalLoading message="Loading Dashboard..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <DashboardSpecificHeader
            isEditing={effectiveIsEditing}
            setIsEditing={handleSetIsEditing}
            onSaveDashboard={handleSaveDashboard}
            currentDashboardName={structure?.title}
            isViewOnly={isViewOnlyMode}
            tabs={
              structure?.tabs.map((tab) => ({
                id: tab.id,
                label: tab.title,
              })) || []
            }
            activeTab={currentTabId}
            onTabChange={handleTabChange}
            onTabReorder={handleTabReorder}
            loadedTabs={loadedTabs}
            currentTabLoading={loading.widgetData}
            currentVersion={currentVersion}
            canEdit={canEdit}
            canPublish={canPublish}
            onSaveDraft={handleSaveDashboard}
            onPublishDraft={handlePublishDraft}
            onSwitchToDraft={handleSwitchToDraft}
            onSwitchToPublished={handleSwitchToPublished}
            onAddNewTab={handleAddNewTab}
            publishedVersion={structure?.publishedVersion}
            draftVersion={structure?.draftVersion}
          />
          <DashboardError error={error} />
        </div>
        <CompanyModal />
      </div>
    );
  }

  // Show loading state for widget data
  if (loading.widgetData && !currentTabWidgets?.length) {
    return (
      <div className="flex h-screen">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <DashboardSpecificHeader
            isEditing={effectiveIsEditing}
            setIsEditing={handleSetIsEditing}
            onSaveDashboard={handleSaveDashboard}
            currentDashboardName={structure?.title}
            isViewOnly={isViewOnlyMode}
            tabs={
              structure?.tabs.map((tab) => ({
                id: tab.id,
                label: tab.title,
              })) || []
            }
            activeTab={currentTabId}
            onTabChange={handleTabChange}
            onTabReorder={handleTabReorder}
            loadedTabs={loadedTabs}
            currentTabLoading={loading.widgetData}
            currentVersion={currentVersion}
            canEdit={canEdit}
            canPublish={canPublish}
            onSaveDraft={handleSaveDashboard}
            onPublishDraft={handlePublishDraft}
            onSwitchToDraft={handleSwitchToDraft}
            onSwitchToPublished={handleSwitchToPublished}
            onAddNewTab={handleAddNewTab}
            publishedVersion={structure?.publishedVersion}
            draftVersion={structure?.draftVersion}
          />
          <DashboardLoading type="widgetData" />
        </div>
        <CompanyModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <DashboardSpecificHeader
          isEditing={effectiveIsEditing}
          setIsEditing={handleSetIsEditing}
          onSaveDashboard={handleSaveDashboard}
          currentDashboardName={structure?.title}
          isViewOnly={isViewOnlyMode}
          tabs={
            structure?.tabs.map((tab) => ({
              id: tab.id,
              label: tab.title,
            })) || []
          }
          activeTab={currentTabId}
          onTabChange={handleTabChange}
          onTabReorder={handleTabReorder}
          loadedTabs={loadedTabs}
          currentTabLoading={loading.widgetData}
          currentVersion={currentVersion}
          canEdit={canEdit}
          canPublish={canPublish}
          onSaveDraft={handleSaveDashboard}
          onPublishDraft={handlePublishDraft}
          onSwitchToDraft={handleSwitchToDraft}
          onSwitchToPublished={handleSwitchToPublished}
          onAddNewTab={handleAddNewTab}
          publishedVersion={structure?.publishedVersion}
          draftVersion={structure?.draftVersion}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Dashboard Controls */}
          {effectiveIsEditing && (
            <div className="">
              <DashboardControls
                blocks={[]} // Empty array since we're using API-loaded components
                setBlocks={() => {}} // Required prop but not used in this implementation
                onDragStart={(block) => {
                  setDraggingBlock({
                    id: block.id,
                    type: block.type,
                    width: block.type === "TABLE" ? 48 : 24,
                    height: block.type === "TABLE" ? 26 : 12,
                    htmlTable: block.htmlTable,
                  });
                }}
                onApiComponentsLoaded={setApiComponents}
                onMetricsLoadingChange={setMetricsLoading}
                onMetricsLoaded={() => setMetricsLoaded(true)}
                onMetricsError={() => setMetricsLoaded(true)} // Mark as loaded even on error to avoid infinite loading
              />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 bg-gray-50 overflow-hidden">
            <DashboardView
              className="flex-grow h-full"
              dashboardItems={dashboardItems}
              setDashboardItems={setDashboardItems}
              blocks={[...viewBlocks, ...apiComponents]} // Include both view blocks and API components
              draggingBlock={draggingBlock}
              isEditing={effectiveIsEditing}
            />
          </div>
        </div>
      </div>
      <CompanyModal />
    </div>
  );
}
