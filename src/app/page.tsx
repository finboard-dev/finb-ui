"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  toggleSidebar,
  setResponsePanelWidth,
} from "@/lib/store/slices/chatSlice";
import ChatContainer from "./components/chat/ChatContainer";
import ChatSidebar from "./components/common/Sidebar";
import ResponsePanel from "./components/notebook/Responsepanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function Home() {
  const dispatch = useAppDispatch();
  const { isSidebarOpen, responsePanelWidth } = useAppSelector(
    (state) => state.chat
  );
  const [panelSizes, setPanelSizes] = useState({
    mainPanelSize: 70,
    responsePanelSize: 30,
  });

  // Move the calculation into a useEffect to ensure it only runs on client
  useEffect(() => {
    const calculateSizes = () => {
      const totalWidth = window.innerWidth;
      const mainPanelSize = 100 - (responsePanelWidth / totalWidth) * 100;
      const responsePanelSize = (responsePanelWidth / totalWidth) * 100;
      return { mainPanelSize, responsePanelSize };
    };

    // Set initial panel sizes
    setPanelSizes(calculateSizes());

    const handleResize = () => {
      setPanelSizes(calculateSizes());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [responsePanelWidth]);

  const handlePanelResize = (sizes: number[]) => {
    if (typeof window !== "undefined") {
      const totalWidth = window.innerWidth;
      let newWidth = Math.round((totalWidth * sizes[1]) / 100);
      newWidth = Math.max(300, Math.min(800, newWidth));
      dispatch(setResponsePanelWidth(newWidth));
    }
  };

  return (
    <main className="flex h-screen overflow-hidden bg-white dark:bg-zinc-900">
      <ChatSidebar />

      <PanelGroup
        direction="horizontal"
        onLayout={handlePanelResize}
        className="flex-1"
      >
        <Panel
          defaultSize={panelSizes.mainPanelSize}
          className="overflow-hidden"
        >
          <ChatContainer />
        </Panel>

        <PanelResizeHandle className="w-[0.2] bg-gray-200 dark:bg-zinc-700 hover:bg-purple-400 dark:hover:bg-purple-600 transition-colors group relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-inherit rounded-full group-hover:bg-purple-400 dark:group-hover:bg-purple-600" />
        </PanelResizeHandle>

        <Panel
          defaultSize={panelSizes.responsePanelSize}
          className="bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 overflow-auto"
          style={{ minWidth: "300px", maxWidth: "800px" }}
        >
          <ResponsePanel />
        </Panel>
      </PanelGroup>
    </main>
  );
}
