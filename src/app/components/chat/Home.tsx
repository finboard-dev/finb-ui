"use client";

import { FC, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import ChatContainer from "./ChatContainer";
import NoChatBranding from "./NoChatBranding";
import ResponsePanel from "./ToolResponse/Responsepanel";
import ChatSidebar from "./ChatSidebar";
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
  // Add other relevant fields
}

const Home: FC = () => {
  const dispatch = useAppDispatch();
  const activeChatId: string | null = useAppSelector((state) => state.chat.activeChatId);
  const isLoadingMessages: boolean = useAppSelector((state) => state.chat.isLoadingMessages); // Added
  const availableAssistants = useAppSelector(selectAllCompanyAssistants);
  const pendingChat: AllChats | null = useAppSelector((state) => state.chat.pendingChat);
  const selectedCompany = store.getState().user.selectedCompany;
  const selectedCompanyId = selectedCompany?.id;

  const activeChat: AllChats | undefined = useAppSelector((state) => {
    if (state.chat.pendingChat && state.chat.pendingChat.id === state.chat.activeChatId) {
      return state.chat.pendingChat;
    }
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
  });

  const responsePanelWidth: number = activeChat?.chats[0]?.responsePanelWidth || 0;
  const activeMessageId: string | null = activeChat?.chats[0]?.activeMessageId || null;
  const messages: MessageType[] = activeChat?.chats[0]?.messages || [];

  const responsePanelRef = useRef<ImperativePanelHandle>(null);

  const userMessages: MessageType[] = messages.filter((msg) => msg.role === "user");
  const showChat: boolean = userMessages.length > 0;

  // @ts-ignore
  const { toolCallResponses }: { toolCallResponses: ToolCallResponse[] } = useAppSelector(
      (state) => state.responsePanel
  );

  const visibleResponses: ToolCallResponse[] = activeMessageId
      ? toolCallResponses.filter((response) => response.messageId === activeMessageId)
      : toolCallResponses;

  const isPanelVisible: boolean = visibleResponses.length > 0 && responsePanelWidth > 0;

  // Initialize default assistant if no active chat
  useEffect(() => {
    const defaultAssistant =
        availableAssistants.find((assist) => assist.name === "report_agent") || availableAssistants[0];
    if (defaultAssistant && !activeChatId) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
  }, [dispatch, availableAssistants, activeChatId]);

  // Handle company selection
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

  const handlePanelResize = (sizes: number[]): void => {
    if (!activeChatId) return;

    const newWidthPercentage: number = sizes[1];
    const viewportWidth: number = window.innerWidth;
    const maxWidthPercentage: number = ((viewportWidth * 0.6) / viewportWidth) * 100;
    const clampedWidth: number = Math.max(20, Math.min(maxWidthPercentage, newWidthPercentage));

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

        <div className="flex flex-1 w-full h-full flex-row">
          {activeChatId ? (
              !showChat && pendingChat && pendingChat.id === activeChatId ? (
                  <NoChatBranding />
              ) : (
                  <PanelGroup direction="horizontal" onLayout={handlePanelResize} className="flex-1">
                    <Panel
                        className="overflow-hidden"
                        defaultSize={isPanelVisible ? 100 - responsePanelWidth : 100}
                    >
                      {isLoadingMessages ? <FinancialReportShimmer /> : <ChatContainer />}
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
                              maxSize={Math.min(60, ((window.innerWidth * 0.6) / window.innerWidth) * 100)}
                              className="bg-white border-l border-gray-200 overflow-auto transition-transform duration-300 ease-in-out transform-gpu"
                              style={{ overflowX: "hidden" }}
                          >
                            <ResponsePanel activeMessageId={activeMessageId as any} isOpen={isPanelVisible} />
                          </Panel>
                        </>
                    )}
                  </PanelGroup>
              )
          ) : (
              <NoChatBranding />
          )}
        </div>
      </main>
  );
};

export default Home;