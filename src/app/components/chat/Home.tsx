"use client";

import { FC, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import ChatContainer from "./ChatContainer";
import NoChatBranding from "./NoChatBranding";
import ResponsePanel from "./ToolResponse/Responsepanel";
import ChatSidebar from "./ChatSidebar";
import Settings from "@/app/components/pages/Settings";
import {
  setResponsePanelWidth,
  setActiveMessageId,
  initializeNewChat,
} from "@/lib/store/slices/chatSlice";
import { FinancialReportShimmer } from "@/app/components/chat/ui/shimmer/ChatShimmer";
import {
  selectAllCompanyAssistants,
  setCompanyError,
  setCompanyLoading,
  setCurrentCompany,
} from "@/lib/store/slices/companySlice";
import type { AllChats, MessageType } from "@/types/chat";
import { Company, selectSelectedCompany, setSelectedCompany } from "@/lib/store/slices/userSlice";
import { setDropDownLoading } from "@/lib/store/slices/loadingSlice";
import { fetcher } from "@/lib/axios/config";
import { toggleComponent } from "@/lib/store/slices/uiSlice";
import { store } from "@/lib/store/store";

interface ToolCallResponse {
  messageId: string;
}

const Home: FC = () => {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const isLoadingMessages = useAppSelector((state) => state.chat.isLoadingMessages);
  const availableAssistants = useAppSelector(selectAllCompanyAssistants);
  const pendingChat = useAppSelector((state) => state.chat.pendingChat);
  const selectedCompany = store.getState().user.selectedCompany;
  const selectedCompanyId = selectedCompany?.id;
  const mainContent = useAppSelector((state) => state.ui.mainContent);

  const activeChat = useAppSelector((state) => {
    if (state.chat.pendingChat && state.chat.pendingChat.id === state.chat.activeChatId) {
      return state.chat.pendingChat;
    }
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
  });

  const isSidebarOpen = useAppSelector((state) => {
    const activeChat = state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
    return activeChat?.chats[0]?.isSidebarOpen ?? true;
  });

  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;
  const activeMessageId = activeChat?.chats[0]?.activeMessageId || null;
  const messages = activeChat?.chats[0]?.messages || [];

  const responsePanelRef = useRef<ImperativePanelHandle>(null);

  const userMessages = messages.filter((msg) => msg.role === "user");
  const showChat = userMessages.length > 0;

  const { toolCallResponses } = useAppSelector((state) => state.responsePanel) as { toolCallResponses: ToolCallResponse[] };
  const visibleResponses = activeMessageId
      ? toolCallResponses.filter((response) => response.messageId === activeMessageId)
      : toolCallResponses;
  const isPanelVisible = visibleResponses.length > 0 && responsePanelWidth > 0;

  useEffect(() => {
    const defaultAssistant =
        availableAssistants.find((assist) => assist.name === "report_agent") || availableAssistants[0];
    if (defaultAssistant && !activeChatId) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
  }, [dispatch, availableAssistants, activeChatId]);

  useEffect(() => {
    const handleCompanySelect = async () => {
      try {
        const response = await fetcher.post("/companies/current", {
          company_id: selectedCompanyId,
        });
        if (response.id === selectedCompanyId) {
          dispatch(setSelectedCompany(response));
        }
        if (response.id) {
          dispatch(setCurrentCompany(response));
        }
        document.cookie = "has_selected_company=true; path=/";
      } catch (err: any) {
        console.error("Error setting current company:", err);
        dispatch(setCompanyError(err.message || "Failed to connect company"));
      } finally {
        dispatch(setDropDownLoading(false));
        dispatch(setCompanyLoading(false));
      }
    };
    handleCompanySelect();
  }, [dispatch, selectedCompanyId]);

  const handlePanelResize = (sizes: number[]) => {
    if (!activeChatId) return;
    const newWidthPercentage = sizes[1];
    const clampedWidth = Math.max(20, Math.min(60, newWidthPercentage));
    if (clampedWidth !== responsePanelWidth) {
      dispatch(setResponsePanelWidth(clampedWidth));
    }
  };

  const ToolCallEventListener: FC = () => {
    useEffect(() => {
      const handleToolCallClick = (event: CustomEvent) => {
        if (event.detail && event.detail.messageId) {
          dispatch(setActiveMessageId(event.detail.messageId));
        }
      };
      window.addEventListener("toolCallSelected", handleToolCallClick as EventListener);
      return () => window.removeEventListener("toolCallSelected", handleToolCallClick as EventListener);
    }, []);
    return null;
  };

  return (
      <main className="flex h-screen overflow-hidden bg-white" style={{ minWidth: 0, minHeight: 0 }}>
        <ToolCallEventListener />
        <ChatSidebar />
        <div className="flex flex-1 w-full h-full flex-row" style={{ minWidth: 0 }}> {/* Added minWidth: 0 */}
          {mainContent === "chat" ? (
              activeChatId ? (
                  !showChat && pendingChat && pendingChat.id === activeChatId ? (
                      <NoChatBranding />
                  ) : (
                      <PanelGroup
                          direction="horizontal"
                          onLayout={handlePanelResize}
                          className="flex-1"
                          style={{ minWidth: 0 }} // Added this
                      >
                        <Panel
                            className="overflow-hidden min-w-0" // Added min-w-0
                            defaultSize={isPanelVisible ? 100 - responsePanelWidth : 100}
                        >
                          {isLoadingMessages ? <FinancialReportShimmer /> : <ChatContainer />}
                        </Panel>
                        {isPanelVisible && (
                            <>
                              <PanelResizeHandle className="w-[0.1px] bg-gray-200 z-50 transition-colors group relative">
                                <div className="absolute hover:bg-slate-900 bg-inherit top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 rounded-full" />
                              </PanelResizeHandle>
                              <Panel
                                  ref={responsePanelRef}
                                  defaultSize={responsePanelWidth}
                                  minSize={35}
                                  maxSize={60}
                                  className="bg-white overflow-auto transition-transform duration-300 ease-in-out transform-gpu"
                                  style={{
                                    overflowX: "hidden",
                                    minWidth: 0,
                                    maxWidth: '60%'
                                  }}
                              >
                                <ResponsePanel
                                    activeMessageId={activeMessageId as any}
                                    isOpen={isPanelVisible}
                                />
                              </Panel>
                            </>
                        )}
                      </PanelGroup>
                  )
              ) : (
                  <NoChatBranding />
              )
          ) : (
              <Settings />
          )}
        </div>
      </main>
  );
};

export default Home;