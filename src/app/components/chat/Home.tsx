"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  toggleSidebar,
  setResponsePanelWidth,
} from "@/lib/store/slices/chatSlice";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ChatContainer from "./ChatContainer";
import NoChatBranding from "./NoChatBranding";
import ResponsePanel from "./ToolResponse/Responsepanel";
import ChatSidebar from "./ChatSidebar";

export default function Home() {
  const dispatch = useAppDispatch();
  const { isSidebarOpen, responsePanelWidth, messages } = useAppSelector(
    (state) => state.chat
  );
  const { toolCallResponses } = useAppSelector((state) => state.responsePanel);

  // Add state for active message ID
  const [activeMessageId, setActiveMessageId] = useState<string | undefined>(
    undefined
  );

  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

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

  // Listen for custom events for when a tool call is clicked
  useEffect(() => {
    const handleToolCallClick = (event: CustomEvent) => {
      if (event.detail && event.detail.messageId) {
        setActiveMessageId(event.detail.messageId);
      }
    };

    // Add event listener for custom event
    window.addEventListener(
      "toolCallSelected",
      handleToolCallClick as EventListener
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "toolCallSelected",
        handleToolCallClick as EventListener
      );
    };
  }, []);

  const getConstraints = () => {
    if (!containerWidth) return { minSize: 20, maxSize: 70 }; // Default constraints

    const minSize = (300 / containerWidth) * 100; // 300px minimum
    const maxSize = (800 / containerWidth) * 100; // 800px maximum

    return { minSize, maxSize };
  };

  const handlePanelResize = (sizes: number[]) => {
    if (!containerWidth) return;

    const newWidth = Math.round((containerWidth * sizes[1]) / 100);

    const clampedWidth = Math.max(300, Math.min(800, newWidth));

    dispatch(setResponsePanelWidth(clampedWidth));
  };

  const { minSize, maxSize } = getConstraints();

  const userMessages = messages.filter((msg) => msg.role === "user");
  const showChat = userMessages.length > 0;

  // Filter tool call responses for the active message
  const visibleResponses = activeMessageId
    ? toolCallResponses.filter(
        (response) => response.messageId === activeMessageId
      )
    : toolCallResponses;

  return (
    <main ref={containerRef} className="flex h-screen overflow-hidden bg-white">
      {/* <Suspense fallback={<div className="w-16 h-full bg-gray-50"></div>}> */}
      <ChatSidebar />
      {/* </Suspense> */}

      <div className="flex flex-1 w-full h-full flex-row-reverse">
        {showChat ? (
          <PanelGroup
            direction="horizontal"
            onLayout={handlePanelResize}
            className="flex-1"
          >
            <Panel className="overflow-hidden" minSize={100 - maxSize}>
              <ChatContainer />
            </Panel>

            {visibleResponses.length > 0 && responsePanelWidth > 0 && (
              <>
                <PanelResizeHandle className="w-[0.2] bg-gray-200 z-50 transition-colors group relative">
                  <div className="absolute hover:bg-slate-900 bg-inherit top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 rounded-full " />
                </PanelResizeHandle>

                <Panel
                  defaultSize={30}
                  minSize={minSize}
                  maxSize={maxSize}
                  className="bg-white border-l border-gray-200 overflow-auto"
                >
                  <ResponsePanel activeMessageId={activeMessageId} />
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
