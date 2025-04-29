"use client";

import { useState } from "react";
import DashboardControls from "./components/DashBoardControls";
import DashboardView from "./components/DashboardView";
import Sidebar from "../components/common/Sidebar";

export type BlockType =
  | "SQL"
  | "Visualization"
  | "Python"
  | "Input"
  | "RichText"
  | "DashboardHeader";

export interface DashboardItem {
  id: string;
  blockId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  content: string;
}

export interface DraggingBlock {
  id: string;
  type: BlockType;
  width: number;
  height: number;
}

export default function Home() {
  const [isEditing, setIsEditing] = useState(true);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      type: "SQL",
      title: "Query Results",
      content: "SELECT * FROM table",
    },
    {
      id: "2",
      type: "Visualization",
      title: "Chart",
      content: "Bar chart data",
    },
    {
      id: "3",
      type: "Python",
      title: "Python Output",
      content: 'print("Hello")',
    },
  ]);
  const [draggingBlock, setDraggingBlock] = useState<DraggingBlock | null>(
    null
  );
  const [latestBlockId, setLatestBlockId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <DashboardView
        className="flex-grow h-full"
        dashboardItems={dashboardItems}
        setDashboardItems={setDashboardItems}
        blocks={blocks}
        setBlocks={setBlocks}
        draggingBlock={draggingBlock}
        latestBlockId={latestBlockId}
        isEditing={isEditing}
      />
      {isEditing && (
        <DashboardControls
          blocks={blocks}
          setBlocks={setBlocks}
          onDragStart={setDraggingBlock}
          onAddBlock={setLatestBlockId}
          dashboardItems={dashboardItems}
          setDashboardItems={setDashboardItems}
        />
      )}
      <button
        className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors shadow-md"
        onClick={() => setIsEditing(!isEditing)}
      >
        {isEditing ? "View Dashboard" : "Edit Dashboard"}
      </button>
    </div>
  );
}
