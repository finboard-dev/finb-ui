"use client";

import React, { useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { setResponsePanelWidth, setActiveMessageId } from "@/lib/store/slices/chatSlice";
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import ChatContainer from "./ChatContainer";
import NoChatBranding from "./NoChatBranding";
import ResponsePanel from "./ToolResponse/Responsepanel";
import ChatSidebar from "./ChatSidebar";

export default function Home() {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const activeChat = useAppSelector((state) =>
      state.chat.chats.find((chat) => chat.id === activeChatId)
  );

  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;
  const activeMessageId = activeChat?.chats[0]?.activeMessageId || null;
  const messages = activeChat?.chats[0]?.messages || [];

  const { toolCallResponses } = useAppSelector((state) => state.responsePanel);

  const responsePanelRef = useRef<ImperativePanelHandle>(null);

  // Filter messages and responses
  const userMessages = messages.filter((msg) => msg.role === "user");
  const showChat = userMessages.length > 0;

  const visibleResponses = activeMessageId
      ? toolCallResponses.filter((response) => response.messageId === activeMessageId)
      : toolCallResponses;

  const isPanelVisible = visibleResponses.length > 0 && responsePanelWidth > 0;

  const handlePanelResize = (sizes: number[]) => {
    if (!activeChatId) return;

    const newWidthPercentage = sizes[1]; // Response panel size
    const viewportWidth = window.innerWidth;
    const maxWidthPercentage = (viewportWidth * 0.6) / viewportWidth * 100; // Limit to 60% of viewport
    const clampedWidth = Math.max(20, Math.min(maxWidthPercentage, newWidthPercentage));

    if (clampedWidth !== responsePanelWidth) {
      dispatch(setResponsePanelWidth(clampedWidth));
    }
  };

  const ToolCallEventListener = () => {
    React.useEffect(() => {
      const handleToolCallClick = (event: CustomEvent) => {
        if (event.detail && event.detail.messageId) {
          dispatch(setActiveMessageId(event.detail.messageId));
        }
      };

      window.addEventListener(
          "toolCallSelected",
          handleToolCallClick as EventListener
      );

      return () => window.removeEventListener(
          "toolCallSelected",
          handleToolCallClick as EventListener
      );
    }, [dispatch]);

    return null;
  };

  return (
      <main className="flex h-screen overflow-hidden bg-white" style={{ minWidth: 0, minHeight: 0 }}>
        <ToolCallEventListener />
        <ChatSidebar />

        <div className="flex flex-1 w-full h-full flex-row">
          {activeChatId && showChat ? (
              <PanelGroup
                  direction="horizontal"
                  onLayout={handlePanelResize}
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
                      <PanelResizeHandle className="w-[0.5px] bg-gray-200 z-50 transition-colors group relative">
                        <div className="absolute hover:bg-slate-900 bg-inherit top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 rounded-full" />
                      </PanelResizeHandle>

                      <Panel
                          ref={responsePanelRef}
                          defaultSize={responsePanelWidth}
                          minSize={20}
                          maxSize={Math.min(60, (window.innerWidth * 0.6) / window.innerWidth * 100)}
                          className="bg-white border-l border-gray-200 overflow-auto transition-transform duration-300 ease-in-out transform-gpu"
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