"use client";

import { useState, useEffect, useCallback } from "react";
import AppSidebar from "./components/ui/LeftSidebar";
import DashboardSpecificHeader from "./components/ui/Header";
import DashboardControls from "./components/Dashboard/DashBoardControls";
import DashboardView from "./components/Dashboard/DashboardView";

import { toast } from "sonner";
import * as echarts from "echarts";
import html2canvas from "html2canvas";
import type { Block, DashboardItem, DraggingBlock } from "./types";

// Updated initial data with new block types
const initialBlocksData: Block[] = [
  {
    id: "global-graph-line-01",
    type: "graph",
    title: "Global Sales Trend",
    content: {
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      },
      yAxis: { type: "value" },
      series: [
        {
          name: "Sales",
          type: "line",
          data: [120, 200, 150, 80, 70, 110],
          smooth: true,
          lineStyle: { color: "#5A67D8" },
          itemStyle: { color: "#5A67D8" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(90,103,216,0.3)" },
              { offset: 1, color: "rgba(163,191,250,0.05)" },
            ]),
          },
        },
      ],
      grid: { top: "15%", bottom: "15%", left: "15%", right: "5%" },
    },
    previewImage: "/placeholder-preview.png",
  },
  {
    id: "global-graph-bar-01",
    type: "graph",
    title: "Regional Performance",
    content: {
      tooltip: {},
      legend: { data: ["Region A", "Region B"], bottom: 5 },
      xAxis: {
        type: "category",
        data: ["Product 1", "Product 2", "Product 3"],
      },
      yAxis: { type: "value" },
      series: [
        {
          name: "Region A",
          type: "bar",
          data: [150, 230, 224],
          itemStyle: { color: "#4FD1C5" },
        },
        {
          name: "Region B",
          type: "bar",
          data: [120, 180, 190],
          itemStyle: { color: "#F6E05E" },
        },
      ],
      grid: { top: "15%", bottom: "20%", left: "10%", right: "5%" },
    },
    previewImage: "/placeholder-preview.png",
  },
  {
    id: "global-table-01",
    type: "table",
    title: "Recent Orders",
    content: {
      report_name: "Recent Orders Data",
      report_table: [
        {
          ID: "ORD001",
          Product: "Laptop Pro X",
          Customer: "J. Doe",
          Amount: 1200,
          Status: "Shipped",
        },
        {
          ID: "ORD002",
          Product: "Wireless Mouse",
          Customer: "A. Smith",
          Amount: 25,
          Status: "Delivered",
        },
        {
          ID: "ORD003",
          Product: "Keyboard Lite",
          Customer: "B. Lee",
          Amount: 75,
          Status: "Processing",
        },
      ],
    },
    previewImage: "/placeholder-preview.png",
  },
  {
    id: "global-metric-01",
    type: "metric",
    title: "Monthly Active Users",
    content: {
      title: "Active Users",
      value: "1.2M",
      change: 12.5,
      changeLabel: "vs last month",
    },
    previewImage: "/placeholder-preview.png",
  },
];

export default function DashboardPage() {
  const [isEditing, setIsEditing] = useState(true);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocksData.map((b) => ({
      ...b,
      previewImage: b.previewImage || "/placeholder-preview.png",
    }))
  );
  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(
    null
  );
  const [latestBlockId, setLatestBlockId] = useState<string | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<
    { id: string; name: string }[]
  >([]);
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(
    null
  );
  const [currentDashboardName, setCurrentDashboardName] =
    useState<string>("Untitled Dashboard");

  const generatePreviewImage = useCallback(
    async (block: Block): Promise<Block> => {
      if (typeof window === "undefined")
        return {
          ...block,
          previewImage: block.previewImage || "/placeholder-preview.png",
        };

      const tempDiv = document.createElement("div");
      Object.assign(tempDiv.style, {
        width: "280px",
        height: "128px",
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
      });
      document.body.appendChild(tempDiv);
      let previewDataUrl = block.previewImage || "/placeholder-preview.png";

      try {
        if (block.type === "graph" && block.content) {
          let visSchema: echarts.EChartsOption | null = null;
          if (typeof block.content === "string") {
            try {
              visSchema = JSON.parse(block.content);
            } catch (e) {
              console.error("Vis preview parse error:", e);
            }
          } else if (
            typeof block.content === "object" &&
            block.content !== null
          ) {
            visSchema = block.content;
          }
          if (visSchema) {
            const chartContainer = document.createElement("div");
            Object.assign(chartContainer.style, {
              width: "100%",
              height: "100%",
            });
            tempDiv.appendChild(chartContainer);
            const chart = echarts.init(chartContainer, null, {
              renderer: "svg",
            });
            chart.setOption({ ...visSchema, animation: false });
            await new Promise((resolve) => setTimeout(resolve, 100));
            previewDataUrl = chart.getDataURL({
              type: "svg",
              pixelRatio: 1,
              backgroundColor: "transparent",
            });
            chart.dispose();
          }
        } else if (block.type === "table" && block.content) {
          let tableData: any[] | null = null;
          const content = block.content;
          if (Array.isArray(content)) tableData = content;
          else if (content && typeof content === "object")
            tableData = (content as any).report_table || (content as any).data;

          if (
            tableData &&
            tableData.length > 0 &&
            typeof tableData[0] === "object" &&
            tableData[0]
          ) {
            const headers = Object.keys(tableData[0]).slice(0, 3);
            const rows = tableData.slice(0, 3);
            const thStyle =
              "border:1px solid #e0e0e0;padding:2px 4px;text-align:left;font-weight:600;font-size:9px;background-color:#f8f8f8;color:#333;";
            const tdStyle =
              "border:1px solid #e0e0e0;padding:2px 4px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px;color:#555;";
            const tableHtml = `<table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;background-color:white;"><thead><tr>${headers
              .map((k) => `<th style="${thStyle}">${k}</th>`)
              .join("")}</tr></thead><tbody>${rows
              .map(
                (row) =>
                  `<tr>${headers
                    .map(
                      (h) =>
                        `<td style="${tdStyle}">${String(row[h] ?? "")}</td>`
                    )
                    .join("")}</tr>`
              )
              .join("")}</tbody></table>`;
            tempDiv.innerHTML = tableHtml;
            const canvas = await html2canvas(tempDiv, {
              scale: 1.5,
              backgroundColor: null,
              logging: false,
              useCORS: true,
            });
            previewDataUrl = canvas.toDataURL("image/png");
          }
        } else if (block.type === "metric" && block.content) {
          const metric = block.content as {
            title: string;
            value: string | number;
            change?: number;
          };
          const changeIndicator = metric.change
            ? metric.change > 0
              ? "▲"
              : "▼"
            : "";
          const changeColor = metric.change
            ? metric.change > 0
              ? "#10B981"
              : "#EF4444"
            : "#6B7280";
          tempDiv.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:Inter,sans-serif;background-color:#F9FAFB;border-radius:4px;padding:8px;">
              <div style="font-size:12px;color:#6B7280;margin-bottom:8px;">${
                metric.title || block.title
              }</div>
              <div style="font-size:24px;font-weight:bold;color:#111827;">${
                metric.value
              }</div>
              ${
                metric.change
                  ? `<div style="font-size:12px;color:${changeColor};font-weight:500;margin-top:4px;">${changeIndicator} ${Math.abs(
                      metric.change
                    )}%</div>`
                  : ""
              }
            </div>`;
          const canvas = await html2canvas(tempDiv, {
            scale: 1.5,
            backgroundColor: null,
            logging: false,
            useCORS: true,
          });
          previewDataUrl = canvas.toDataURL("image/png");
        } else if (
          block.title &&
          (!block.previewImage ||
            block.previewImage === "/placeholder-preview.png")
        ) {
          tempDiv.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-size:11px;color:#374151;text-align:center;overflow:hidden;padding:8px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;font-family:Inter,sans-serif;"><strong style="font-size:14px;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px;color:#1e40af;">${block.title}</strong><span style="font-size:9px;color:#1d4ed8;">(${block.type})</span></div>`;
          const canvas = await html2canvas(tempDiv, {
            scale: 1.5,
            backgroundColor: null,
            logging: false,
            useCORS: true,
          });
          previewDataUrl = canvas.toDataURL("image/png");
        }
      } catch (error) {
        console.error(`Preview gen error for ${block.id}:`, error);
      } finally {
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      }
      return { ...block, previewImage: previewDataUrl };
    },
    []
  );

  // The rest of the component remains largely the same, this is a subset of changes.
  // ... (useEffect, handleSaveDashboard, handleLoadDashboard, etc.)

  useEffect(() => {
    let isMounted = true;
    const updatePreviews = async () => {
      const blocksNeedingPreview = blocks.filter(
        (b) => !b.previewImage || b.previewImage === "/placeholder-preview.png"
      );
      if (blocksNeedingPreview.length > 0) {
        const updatedBlockArray = await Promise.all(
          blocks.map((b) =>
            !b.previewImage || b.previewImage === "/placeholder-preview.png"
              ? generatePreviewImage(b)
              : Promise.resolve(b)
          )
        );
        if (isMounted) setBlocks(updatedBlockArray);
      }
    };
    if (typeof window !== "undefined") updatePreviews();
    return () => {
      isMounted = false;
    };
  }, [blocks, generatePreviewImage]);

  useEffect(() => {
    try {
      const meta = JSON.parse(
        localStorage.getItem("savedDashboardsMeta") || "[]"
      );
      setSavedDashboards(
        meta.sort((a: any, b: any) => a.name.localeCompare(b.name))
      );
    } catch (e) {
      console.error("Failed to load dashboards list:", e);
      setSavedDashboards([]);
    }
  }, []);

  const triggerSaveDashboard = () => {
    const name = prompt(
      "Enter dashboard name for saving:",
      currentDashboardName === "Untitled Dashboard" ? "" : currentDashboardName
    );
    if (name && name.trim()) {
      handleSaveDashboard(name.trim());
    } else if (name !== null) {
      toast.error("Dashboard name cannot be empty.");
    }
  };

  const handleSaveDashboard = (name: string) => {
    const blockIdsInUse = new Set(dashboardItems.map((item) => item.blockId));
    const relevantBlocks = blocks.filter((block) =>
      blockIdsInUse.has(block.id)
    );
    const dashboardState = {
      name,
      dashboardItems,
      blocks: relevantBlocks,
      lastModified: new Date().toISOString(),
    };
    const id = currentDashboardId || `dashboard-${Date.now()}`;
    localStorage.setItem(id, JSON.stringify(dashboardState));
    let metaList = savedDashboards.filter((d) => d.id !== id);
    metaList.push({ id, name });
    metaList.sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem("savedDashboardsMeta", JSON.stringify(metaList));
    setSavedDashboards(metaList);
    setCurrentDashboardId(id);
    setCurrentDashboardName(name);
    setIsEditing(false);
    toast.success(`Dashboard "${name}" saved!`);
  };

  const handleLoadDashboard = useCallback(
    async (id: string) => {
      const stateStr = localStorage.getItem(id);
      if (!stateStr) {
        toast.error("Saved dashboard data not found.");
        return;
      }
      try {
        const {
          name,
          dashboardItems: loadedItems,
          blocks: loadedStoredBlocks,
        } = JSON.parse(stateStr);
        if (!Array.isArray(loadedItems) || !Array.isArray(loadedStoredBlocks)) {
          toast.error("Invalid dashboard data format.");
          return;
        }
        setDashboardItems(loadedItems);
        const baseBlocks = [...initialBlocksData];
        const myCompStr = localStorage.getItem("dashboardBlocks");
        if (myCompStr) {
          const myComps = JSON.parse(myCompStr) as Block[];
          myComps.forEach((mc) => {
            if (!baseBlocks.some((b) => b.id === mc.id)) baseBlocks.push(mc);
          });
        }
        (loadedStoredBlocks as Block[]).forEach((lb) => {
          const idx = baseBlocks.findIndex((b) => b.id === lb.id);
          if (idx !== -1) baseBlocks[idx] = lb;
          else baseBlocks.push(lb);
        });
        const blocksWithPreviews = await Promise.all(
          baseBlocks.map((b) =>
            !b.previewImage || b.previewImage === "/placeholder-preview.png"
              ? generatePreviewImage(b)
              : Promise.resolve(b)
          )
        );
        setBlocks(blocksWithPreviews);
        setCurrentDashboardId(id);
        setCurrentDashboardName(name || "Loaded Dashboard");
        setIsEditing(false);
        toast.success(`Dashboard "${name || "Dashboard"}" loaded.`);
      } catch (err) {
        console.error("Load dashboard error:", err);
        toast.error("Failed to load dashboard.");
      }
    },
    [generatePreviewImage]
  );

  const handleNewDashboard = () => {
    setDashboardItems([]);
    setCurrentDashboardId(null);
    setCurrentDashboardName("Untitled Dashboard");
    setIsEditing(true);
    toast.info("New dashboard created.");
  };

  const updateBlocksState = useCallback(
    (updater: Block[] | ((prev: Block[]) => Block[])) => {
      setBlocks(typeof updater === "function" ? updater : () => updater);
    },
    []
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <AppSidebar
        savedDashboards={savedDashboards}
        onLoadDashboard={handleLoadDashboard}
        currentDashboardId={currentDashboardId}
        onNewDashboard={handleNewDashboard}
        isEditing={isEditing}
      />
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60">
        <DashboardSpecificHeader
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSaveDashboard={triggerSaveDashboard}
          currentDashboardName={currentDashboardName}
        />
        <main className="flex-1 flex flex-row overflow-hidden relative bg-slate-100">
          <DashboardView
            className="flex-grow h-full"
            dashboardItems={dashboardItems}
            setDashboardItems={setDashboardItems}
            blocks={blocks}
            setBlocks={updateBlocksState}
            draggingBlock={draggingBlock}
            onAddBlock={setLatestBlockId}
            isEditing={isEditing}
          />
          {isEditing && (
            <DashboardControls
              blocks={blocks}
              setBlocks={updateBlocksState}
              onDragStart={setDraggingBlock}
            />
          )}
        </main>
      </div>
    </div>
  );
}
