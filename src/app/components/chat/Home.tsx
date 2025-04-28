"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  toggleSidebar,
  setResponsePanelWidth,
  setActiveMessageId,
} from "@/lib/store/slices/chatSlice";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ChatContainer from "./ChatContainer";
import NoChatBranding from "./NoChatBranding";
import ResponsePanel from "./ToolResponse/Responsepanel";
import ChatSidebar from "./ChatSidebar";
import debounce from "lodash/debounce"; // Add lodash for debouncing

export default function Home() {
  const dispatch = useAppDispatch();
  const { isSidebarOpen, responsePanelWidth, messages, activeMessageId } =
    useAppSelector((state) => state.chat);
  const { toolCallResponses } = useAppSelector((state) => state.responsePanel);

  const [containerWidth, setContainerWidth] = useState(0);
  const [isPanelResizing, setIsPanelResizing] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false); // Track content stability
  const containerRef = useRef<HTMLElement | null>(null);

  // Default panel size as a percentage
  const getDefaultPanelSize = () => 30; // Default to 30% of container width

  // Debounced update of container width to stabilize layout
  const updateContainerWidth = debounce(() => {
    if (containerRef.current) {
      const newContainerWidth = containerRef.current.offsetWidth;
      setContainerWidth(newContainerWidth);

      // Clamp responsePanelWidth to stay within 20% to 70%
      if (responsePanelWidth > 70) {
        dispatch(setResponsePanelWidth(70));
      } else if (responsePanelWidth < 20 && responsePanelWidth > 0) {
        dispatch(setResponsePanelWidth(20));
      }
    }
  }, 100); // 100ms debounce to wait for layout to settle

  // Update container width and content readiness on resize or mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);

    // Mark content as ready after initial render
    const timer = setTimeout(() => setIsContentReady(true), 100);
    return () => {
      window.removeEventListener("resize", updateContainerWidth);
      clearTimeout(timer);
    };
  }, [responsePanelWidth, dispatch]);

  // Handle tool call click events
  useEffect(() => {
    const handleToolCallClick = (event: CustomEvent) => {
      if (event.detail && event.detail.messageId) {
        dispatch(setActiveMessageId(event.detail.messageId));
      }
    };

    window.addEventListener(
      "toolCallSelected",
      handleToolCallClick as EventListener
    );
    return () =>
      window.removeEventListener(
        "toolCallSelected",
        handleToolCallClick as EventListener
      );
  }, [dispatch]);

  // Dynamic constraints for panel resizing
  const getConstraints = () => ({
    minSize: 20,
    maxSize: 70, // 20% min, 70% max
  });

  // Handle panel resizing
  const handlePanelLayout = (sizes: number[]) => {
    if (!containerWidth || isPanelResizing || !isContentReady) return;

    const newWidthPercentage = sizes[1]; // Response panel size in percentage
    const clampedWidth = Math.max(20, Math.min(70, newWidthPercentage));
    dispatch(setResponsePanelWidth(clampedWidth));
  };

  // Track panel resizing state
  useEffect(() => {
    const handleResizeStart = () => setIsPanelResizing(true);
    const handleResizeEnd = () => setIsPanelResizing(false);

    window.addEventListener("panel-resize-start", handleResizeStart);
    window.addEventListener("panel-resize-end", handleResizeEnd);

    return () => {
      window.removeEventListener("panel-resize-start", handleResizeStart);
      window.removeEventListener("panel-resize-end", handleResizeEnd);
    };
  }, []);

  const { minSize, maxSize } = getConstraints();
  const userMessages = messages.filter((msg) => msg.role === "user");
  const showChat = userMessages.length > 0;

  // Filter tool call responses for active message
  const visibleResponses = activeMessageId
    ? toolCallResponses.filter(
        (response) => response.messageId === activeMessageId
      )
    : toolCallResponses;

  const isPanelVisible = visibleResponses.length > 0 && responsePanelWidth > 0;

  return (
    <main
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-white"
      style={{ minWidth: 0, minHeight: 0 }} // Prevent layout collapse
    >
      <ChatSidebar />

      <div className="flex flex-1 w-full h-full flex-row">
        {showChat ? (
          <PanelGroup
            direction="horizontal"
            onLayout={handlePanelLayout}
            className="flex-1"
          >
            <Panel
              className="overflow-hidden"
              defaultSize={isPanelVisible ? 100 - responsePanelWidth : 100}
            >
              <ChatContainer />
            </Panel>

            {isPanelVisible && (
              <>
                <PanelResizeHandle
                  onDragStart={() =>
                    window.dispatchEvent(new Event("panel-resize-start"))
                  }
                  onDragEnd={() =>
                    window.dispatchEvent(new Event("panel-resize-end"))
                  }
                  className="w-[0.5px] bg-gray-200 z-50 transition-colors group relative"
                >
                  <div className="absolute hover:bg-slate-900 bg-inherit top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 rounded-full" />
                </PanelResizeHandle>

                <Panel
                  defaultSize={responsePanelWidth}
                  minSize={minSize}
                  maxSize={maxSize}
                  className={`bg-white border-l border-gray-200 overflow-auto transition-transform duration-300 ease-in-out ${
                    isPanelResizing ? "" : "transform-gpu"
                  }`}
                  style={{ overflowX: "hidden" }}
                >
                  <ResponsePanel
                    activeMessageId={activeMessageId as any}
                    isOpen={isPanelVisible}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        ) : (
          <NoChatBranding />
        )}
      </div>
    </main>
  );
}
