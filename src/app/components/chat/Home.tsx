"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import ChatContainer from "./layout/ChatContainer";
import NoChatBranding from "./chat-container/NoChatBranding";
import ResponsePanel from "./layout/Responsepanel";
import ChatSidebar from "./layout/ChatSidebar";

import {
  setResponsePanelWidth,
  setActiveMessageId,
  initializeNewChat,
} from "@/lib/store/slices/chatSlice";
import { ChatConversationLoader } from "./chat-container/ChatConversationLoader";
import {
  selectSelectedCompany,
  setSelectedCompany,
  Company,
  setCompanies,
  setUserData,
} from "@/lib/store/slices/userSlice";
import { selectDropDownLoading } from "@/lib/store/slices/loadingSlice";
import { fetcher } from "@/lib/axios/config";
import { setMainContent, toggleComponent } from "@/lib/store/slices/uiSlice";
import { store } from "@/lib/store/store";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingAnimation from "@/app/components/common/ui/GlobalLoading";
import { useUrlParams } from "@/lib/utils/urlParams";
import {
  useAllCompanies,
  useCurrentCompany,
} from "@/hooks/query-hooks/useCompany";
import { CompanyModal } from "./sidebar/CompanyModal";

interface ToolCallResponse {
  messageId: string;
}

const Home: FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateToContent, navigateToChat } = useUrlParams();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const isCompanyLoading = useAppSelector(selectDropDownLoading);
  const selectedCompany: any = useAppSelector(
    selectSelectedCompany
  ) as Company & {
    assistants?: any[];
  };
  const availableAssistants: any[] = selectedCompany?.assistants || [];
  const pendingChat = useAppSelector((state) => state.chat.pendingChat);
  const chats = useAppSelector((state) => state.chat.chats);
  const selectedCompanyId = selectedCompany?.id;

  const [error, setError] = useState<string | null>(null);
  const companies = useAppSelector((state) => state.user.companies);
  const selectedOrganization = useAppSelector(
    (state) => state.user.selectedOrganization
  );
  const user = useAppSelector((state) => state.user.user);

  // React Query hooks
  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useAllCompanies();
  const {
    data: currentCompanyData,
    isLoading: isLoadingCurrentCompany,
    error: currentCompanyError,
  } = useCurrentCompany(selectedCompanyId || "");

  const activeChat = useAppSelector((state) => {
    if (
      state.chat.pendingChat &&
      state.chat.pendingChat.id === state.chat.activeChatId
    ) {
      return state.chat.pendingChat;
    }
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
  });

  const isSidebarOpen = useAppSelector((state) => {
    const activeChat = state.chat.chats.find(
      (chat) => chat.id === state.chat.activeChatId
    );
    return activeChat?.chats[0]?.isSidebarOpen ?? true;
  });

  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;
  const activeMessageId = activeChat?.chats[0]?.activeMessageId || null;
  const messages = activeChat?.chats[0]?.messages || [];

  const responsePanelRef = useRef<ImperativePanelHandle>(null);

  const userMessages = messages.filter((msg) => msg.role === "user");
  const showChat = userMessages.length > 0;

  // Check if currently streaming
  const isStreaming = activeChat?.chats[0]?.isResponding || false;

  // Check if there are existing messages from a previous conversation
  // We consider messages as "existing" if they have a messageId (from API) or if there are more than 2 messages (indicating previous conversation)
  const hasExistingMessages =
    messages.some((msg) => msg.messageId) || messages.length > 2;

  // Load conversation data if:
  // 1. There are existing messages from a previous conversation, OR
  // 2. We're not currently streaming (to avoid interference with new chat streaming)
  const shouldLoadConversation = hasExistingMessages || !isStreaming;

  const { toolCallResponses } = useAppSelector(
    (state) => state.responsePanel
  ) as { toolCallResponses: ToolCallResponse[] };
  const visibleResponses = activeMessageId
    ? toolCallResponses.filter(
        (response) => response.messageId === activeMessageId
      )
    : toolCallResponses;
  const isPanelVisible = visibleResponses.length > 0 && responsePanelWidth > 0;

  useEffect(() => {
    const defaultAssistant =
      availableAssistants.find((assist) => assist.name === "report_agent") ||
      availableAssistants[0];
    if (defaultAssistant && !activeChatId) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
  }, [dispatch, availableAssistants, activeChatId]);

  // Handle companies data from React Query
  useEffect(() => {
    if (companiesData) {
      const mappedCompanies = (companiesData?.data || companiesData || []).map(
        (company: any) => ({
          ...company,
          name: company.companyName,
          status: company.isActive ? "ACTIVE" : "INACTIVE",
        })
      );
      dispatch(setCompanies(mappedCompanies));
    }
  }, [companiesData, dispatch]);

  // Handle current company data from React Query
  useEffect(() => {
    if (currentCompanyData && selectedCompanyId) {
      const response = currentCompanyData?.data || currentCompanyData;
      if (
        response?.id === selectedCompanyId ||
        response?.data?.id === selectedCompanyId
      ) {
        const companyData = response?.data || response;
        dispatch(setSelectedCompany(companyData));

        // Also update the user object to keep it in sync
        if (user) {
          const updatedUser = {
            ...user,
            selectedCompany: companyData,
          };

          dispatch(
            setUserData({
              user: updatedUser,
              selectedOrganization: selectedOrganization || undefined,
              selectedCompany: companyData,
            })
          );
        }
      }
      document.cookie = "has_selected_company=true; path=/";
    }
  }, [currentCompanyData, selectedCompanyId, dispatch]);

  useEffect(() => {
    if (!selectedCompany?.name) {
      console.log("home company");
      router.push("/company-selection");
    }
  }, [companies, router]);

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
      window.addEventListener(
        "toolCallSelected",
        handleToolCallClick as EventListener
      );
      return () =>
        window.removeEventListener(
          "toolCallSelected",
          handleToolCallClick as EventListener
        );
    }, []);
    return null;
  };

  const handleCompanyChange = () => {
    // window.location.reload();
    console.log("company changed");
  };

  // Show loading animation for company operations
  if (isCompanyLoading || isLoadingCompanies || isLoadingCurrentCompany) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <LoadingAnimation message={"Loading company data... Please wait!"} />
      </div>
    );
  }

  return (
    <main
      className="flex h-screen overflow-hidden bg-white"
      style={{ minWidth: 0, minHeight: 0 }}
    >
      <ToolCallEventListener />
      <ChatSidebar />
      <div
        className="flex flex-1 w-full h-full flex-row"
        style={{ minWidth: 0 }}
      >
        {" "}
        {/* Added minWidth: 0 */}
        {activeChatId ? (
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
                className="overflow-hidden min-w-0"
                defaultSize={isPanelVisible ? 100 - responsePanelWidth : 100}
              >
                {activeChat?.thread_id ? (
                  <ChatConversationLoader
                    threadId={activeChat.thread_id}
                    chatId={activeChat.id}
                    hasExistingMessages={shouldLoadConversation}
                  >
                    <ChatContainer />
                  </ChatConversationLoader>
                ) : (
                  <ChatContainer />
                )}
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
                      maxWidth: "60%",
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
        )}
      </div>

      {/* Company Modal - rendered independently */}
      <CompanyModal onCompanyChange={handleCompanyChange} />
    </main>
  );
};

export default Home;
