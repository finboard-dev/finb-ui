"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
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
  selectSelectedCompany,
  setSelectedCompany,
  Company,
  setCompanies,
} from "@/lib/store/slices/userSlice";
// import { setDropDownLoading } from "@/lib/store/slices/loadingSlice";
import { fetcher } from "@/lib/axios/config";
import { setMainContent, toggleComponent } from "@/lib/store/slices/uiSlice";
import { store } from "@/lib/store/store";
import { getAllCompany, getCurrentCompany } from "@/lib/api/allCompany";
import { useRouter } from "next/navigation";

interface ToolCallResponse {
  messageId: string;
}

const Home: FC = () => {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const isLoadingMessages = useAppSelector(
    (state) => state.chat.isLoadingMessages
  );
  const selectedCompany: any = useAppSelector(
    selectSelectedCompany
  ) as Company & {
    assistants?: any[];
  };
  const availableAssistants: any[] = selectedCompany?.assistants || [];
  const pendingChat = useAppSelector((state) => state.chat.pendingChat);
  const selectedCompanyId = selectedCompany?.id;
  const mainContent = useAppSelector((state) => state.ui.mainContent);
  const [error, setError] = useState<string | null>(null);
  const companies = useAppSelector((state) => state.user.companies);
  const selectedOrganization = useAppSelector(
    (state) => state.user.selectedOrganization
  );
  const router = useRouter();

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

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await getAllCompany();
        const mappedCompanies = (response?.data || response || []).map(
          (company: any) => ({
            ...company,
            name: company.companyName,
            status: company.isActive ? "ACTIVE" : "INACTIVE",
          })
        );
        dispatch(setCompanies(mappedCompanies));
      } catch (err) {
        console.error("Failed to fetch companies", err);
      }
    }
    fetchCompanies();
  }, [selectedOrganization, dispatch]);

  useEffect(() => {
    const handleCompanySelect = async () => {
      setError(null);
      try {
        if (!selectedCompanyId) {
          throw new Error("No company selected");
        }
        const response = await getCurrentCompany(selectedCompanyId);
        if (
          response?.id === selectedCompanyId ||
          response?.data?.id === selectedCompanyId
        ) {
          dispatch(setSelectedCompany(response?.data || response));
        }
        if (response?.id || response?.data?.id) {
          // dispatch(setCurrentCompany(response?.data || response));
        }
        document.cookie = "has_selected_company=true; path=/";
      } catch (error: any) {
        if (error.name === "CanceledError") {
          // Request was canceled, do not show error
          return;
        }
        setError(error.message || "Error setting current company");
        console.error("Error setting current company:", error);
      }
    };
    handleCompanySelect();
  }, [dispatch, selectedCompanyId]);

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
                  {isLoadingMessages ? (
                    <FinancialReportShimmer />
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
          )
        ) : (
          <Settings onBackClick={() => dispatch(setMainContent("chat"))} />
        )}
      </div>
    </main>
  );
};

export default Home;
