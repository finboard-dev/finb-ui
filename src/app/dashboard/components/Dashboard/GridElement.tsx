"use client";

import { useCallback } from "react";
import {
  Edit3Icon,
  Trash2Icon,
  GripVerticalIcon,
  MoreVerticalIcon,
  AlertTriangleIcon,
  Loader2Icon,
  CopyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block, DashboardItem } from "../../types";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MetricsCard from "../ui/MetricsCard";

const RestrictedChart = dynamic(
  () =>
    import("@/app/tests/echarts/page").catch(() => () => (
      <ErrorDisplay message="Chart renderer failed to load." />
    )),
  { ssr: false, loading: () => <LoadingDisplay message="Loading chart..." /> }
);
const DynamicTable = dynamic(
  () =>
    import("@/app/tests/components/DynamicTableRenderer").catch(() => () => (
      <ErrorDisplay message="Table renderer failed to load." />
    )),
  { ssr: false, loading: () => <LoadingDisplay message="Loading table..." /> }
);

function LoadingDisplay({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
      <Loader2Icon className="w-8 h-8 animate-spin mb-2 text-blue-500" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

function ErrorDisplay({
  message,
  details,
}: {
  message: string;
  details?: string;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 bg-red-50 rounded-md border border-red-200">
      <AlertTriangleIcon className="w-8 h-8 mb-2" />
      <span className="text-sm font-semibold">{message}</span>
      {details && <p className="text-xs mt-1 text-red-500">{details}</p>}
    </div>
  );
}

export default function GridElement({
  item,
  block,
  dashboardItem,
  onDelete,
  isEditingDashboard,
}: {
  item: any;
  block: Block | undefined;
  dashboardItem?: DashboardItem;
  onDelete: (id: string) => void;
  isEditingDashboard: boolean;
}) {
  const onDeleteHandler = useCallback(
    () => onDelete(item.i),
    [onDelete, item.i]
  );
  const onEditHandler = () =>
    toast.info(`Edit for "${block?.title || "component"}" TBD.`);
  const onDuplicateHandler = () =>
    toast.info(`Duplicate for "${block?.title || "component"}" TBD.`);

  const renderBlockContent = () => {
    if (!block)
      return (
        <ErrorDisplay
          message="Component data missing."
          details={`ID: ${dashboardItem?.blockId}`}
        />
      );

    try {
      switch (block.type) {
        case "graph":
          if (block.content?.error)
            return (
              <ErrorDisplay
                message="Invalid chart data."
                details={block.content.error}
              />
            );
          if (!block.content)
            return <ErrorDisplay message="Missing chart data." />;
          return (
            <div className="w-full h-full" style={{ minHeight: "150px" }}>
              <RestrictedChart data={block.content} />
            </div>
          );

        case "table":
          if (
            typeof block.content === "string" &&
            block.content.includes("<table")
          ) {
            return (
              <div className="w-full h-full overflow-auto">
                <DynamicTable
                  data={block.content}
                  isLoading={false}
                  error={null}
                />
              </div>
            );
          }
          return (
            <ErrorDisplay message="Table data must be an HTML <table> string." />
          );

        case "metric":
          const metricData = block.content;
          if (metricData && typeof metricData.value !== "undefined") {
            return (
              <div className="w-full h-full flex items-center justify-center p-3">
                <MetricsCard
                  title={block.title}
                  value={metricData.value}
                  change={metricData.change}
                  changeLabel={metricData.changeLabel}
                  className="w-full"
                />
              </div>
            );
          }
          return <ErrorDisplay message="Invalid metric data." />;

        default:
          return (
            <div className="p-4 text-sm">{`Unsupported block type: ${
              (block as any).type
            }`}</div>
          );
      }
    } catch (error: any) {
      return (
        <ErrorDisplay
          message="Error rendering component."
          details={error.message || String(error)}
        />
      );
    }
  };

  // The rest of the component's JSX (Card, CardHeader, DropdownMenu, etc.) remains unchanged.
  const dragHandleClass = isEditingDashboard
    ? "drag-handle cursor-grab"
    : "cursor-default";

  return (
    <Card
      className={cn(
        "h-full w-full flex flex-col bg-white overflow-hidden rounded-lg shadow-sm border border-slate-200",
        isEditingDashboard
          ? "hover:shadow-md hover:border-slate-300"
          : "border-slate-200"
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 py-2 px-3 h-[45px] flex-shrink-0",
          "bg-slate-50 border-b border-slate-200"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 flex-grow min-w-0",
            dragHandleClass
          )}
        >
          {isEditingDashboard && (
            <span
              className="text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Drag to reorder"
            >
              <GripVerticalIcon className="h-5 w-5" />
            </span>
          )}
          <CardTitle
            className="text-sm font-semibold text-slate-700 truncate"
            title={block?.title || "Untitled"}
          >
            {block?.title || "Untitled"}
          </CardTitle>
        </div>
        {isEditingDashboard && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 grid-element-button text-slate-500 hover:text-slate-700 hover:bg-slate-200"
              >
                <MoreVerticalIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white shadow-xl border-slate-200 z-[100]"
            >
              <DropdownMenuItem onClick={onEditHandler} className="text-sm opt">
                <Edit3Icon className="w-3.5 h-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDuplicateHandler}
                className="text-sm opt"
              >
                <CopyIcon className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200" />
              <DropdownMenuItem
                onClick={onDeleteHandler}
                className="text-sm text-red-600 hover:!text-red-500 hover:!bg-red-50 focus:!bg-red-50 focus:!text-red-600 opt"
              >
                <Trash2Icon className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className={cn("flex-grow overflow-auto relative p-0")}>
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}
