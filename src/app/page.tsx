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

  // We'll keep track of the container width
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  // Initialize and update container width
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate the min and max percentages based on the container width
  const getConstraints = () => {
    if (!containerWidth) return { minSize: 20, maxSize: 70 }; // Default constraints

    const minSize = (300 / containerWidth) * 100; // 300px minimum
    const maxSize = (800 / containerWidth) * 100; // 800px maximum

    return { minSize, maxSize };
  };

  const handlePanelResize = (sizes: number[]) => {
    if (!containerWidth) return;

    // Calculate the new width in pixels based on percentage
    const newWidth = Math.round((containerWidth * sizes[1]) / 100);

    // Clamp the value between 300px and 800px
    const clampedWidth = Math.max(300, Math.min(800, newWidth));

    // Store the new width in your state
    dispatch(setResponsePanelWidth(clampedWidth));
  };

  const { minSize, maxSize } = getConstraints();

  return (
    <main
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-white dark:bg-zinc-900"
    >
      <ChatSidebar />

      <PanelGroup
        direction="horizontal"
        onLayout={handlePanelResize}
        className="flex-1"
      >
        <Panel
          className="overflow-hidden"
          minSize={100 - maxSize} // Ensure main panel doesn't get too small
        >
          <ChatContainer />
        </Panel>

        <PanelResizeHandle className="w-[0.2] bg-gray-200 dark:bg-zinc-700 hover:bg-purple-400 dark:hover:bg-purple-600 transition-colors group relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-inherit rounded-full group-hover:bg-purple-400 dark:group-hover:bg-purple-600" />
        </PanelResizeHandle>

        <Panel
          defaultSize={30}
          minSize={minSize}
          maxSize={maxSize}
          className="bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 overflow-auto"
        >
          <ResponsePanel />
        </Panel>
      </PanelGroup>
    </main>
  );
}
