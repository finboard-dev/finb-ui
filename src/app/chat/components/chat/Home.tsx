'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import ChatContainer from './layout/ChatContainer';
import NoChatBranding from './chat-container/NoChatBranding';
import ResponsePanel from './layout/Responsepanel';
import ChatSidebar from './layout/ChatSidebar';
import Navbar from '@/components/ui/common/navbar';

import { setResponsePanelWidth, setActiveMessageId, initializeNewChat } from '@/lib/store/slices/chatSlice';
import { ChatConversationLoader } from './chat-container/ChatConversationLoader';
import { selectSelectedCompany, Company } from '@/lib/store/slices/userSlice';
import { selectDropDownLoading } from '@/lib/store/slices/loadingSlice';
import { fetcher } from '@/lib/axios/config';
import { setMainContent, toggleComponent, selectIsComponentOpen } from '@/lib/store/slices/uiSlice';
import { store } from '@/lib/store/store';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingAnimation from '@/components/ui/common/GlobalLoading';
import { useUrlParams } from '@/lib/utils/urlParams';
import { useCompanyData } from '@/hooks/query-hooks/useCompany';
import { CompanyModal } from '../../../../components/ui/common/CompanyModal';
import NewChatButton from './ui/NewChatButton';
import ChatSearchDropdown from './ui/ChatSearchDropdown';
import { Sidebar } from '@/components/ui/common/sidebar';

interface ToolCallResponse {
  messageId: string;
}

const Home: FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isParamSet,
    isHashParamSet,
    startNewChat,
    navigateToChat,
    navigateToSettings,
    navigateToChatSettings,
    toggleComponentState,
  } = useUrlParams();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const isCompanyLoading = useAppSelector(selectDropDownLoading);
  const selectedCompany: any = useAppSelector(selectSelectedCompany) as Company & {
    assistants?: any[];
  };
  const availableAssistants: any[] = selectedCompany?.assistants || [];
  const pendingChat = useAppSelector((state) => state.chat.pendingChat);
  const chats = useAppSelector((state) => state.chat.chats);
  const selectedCompanyId = selectedCompany?.id;

  const [error, setError] = useState<string | null>(null);
  const companies = useAppSelector((state) => state.user.companies);
  const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization);
  const user = useAppSelector((state) => state.user.user);

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: 'ui/initializeComponent',
      payload: {
        type: 'sidebar',
        id: 'sidebar-chat',
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

  // React Query hooks - using common hook
  const {
    companiesData,
    currentCompanyData,
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useCompanyData(selectedCompanyId);

  const activeChat = useAppSelector((state) => {
    if (state.chat.pendingChat && state.chat.pendingChat.id === state.chat.activeChatId) {
      return state.chat.pendingChat;
    }
    return state.chat.chats.find((chat) => chat.id === state.chat.activeChatId);
  });

  // Remove the old chat-specific sidebar state logic
  // const isSidebarOpen = useAppSelector((state) => {
  //   const activeChat = state.chat.chats.find(
  //     (chat) => chat.id === state.chat.activeChatId
  //   );
  //   return activeChat?.chats[0]?.isSidebarOpen ?? true;
  // });

  const responsePanelWidth = activeChat?.chats[0]?.responsePanelWidth || 0;
  const activeMessageId = activeChat?.chats[0]?.activeMessageId || null;
  const messages = activeChat?.chats[0]?.messages || [];

  const responsePanelRef = useRef<ImperativePanelHandle>(null);

  const userMessages = messages.filter((msg) => msg.role === 'user');
  const showChat = userMessages.length > 0;

  // Check if currently streaming
  const isStreaming = activeChat?.chats[0]?.isResponding || false;

  // Check if this is a fresh conversation (just started) vs an existing one
  const isFreshConversation =
    (activeChat?.chats[0]?.messages?.length || 0) <= 2 && !messages.some((msg) => msg.messageId);

  // Check if we have a threadId in URL but no messages in state (refresh scenario)
  const hasThreadIdButNoMessages = !!activeChat?.thread_id && messages.length === 0;

  // Check if we're in an active conversation session (not navigating to existing)
  // An active session means we started this conversation in this browser session
  const isActiveSession = !hasThreadIdButNoMessages && messages.length > 0;

  // Check if there are existing messages from a previous conversation
  // We ONLY consider messages as "existing" if they have a messageId (from API)
  // This prevents unnecessary refetches during active conversations that cause shimmer UI
  // The messageId indicates the message was saved to the server and we're loading from server
  const hasExistingMessages = messages.some((msg) => msg.messageId);

  // Load conversation data if:
  // 1. There are existing messages from a previous conversation (with messageId), AND
  // 2. We're not currently streaming (to avoid interference with new chat streaming), AND
  // 3. This is not a fresh conversation that just started, AND
  // 4. We're not in an active session (to prevent refetching during active conversations)
  // OR if we have a threadId but no messages (refresh scenario)
  // This prevents the shimmer UI from appearing during active conversations
  const shouldLoadConversation =
    (hasExistingMessages && !isStreaming && !isFreshConversation && !isActiveSession) || hasThreadIdButNoMessages;

  // Debug logging to understand refetch behavior
  console.log('Chat Load Debug:', {
    messagesLength: messages.length,
    hasMessageIds: messages.some((msg) => msg.messageId),
    hasExistingMessages,
    isStreaming,
    isFreshConversation,
    hasThreadIdButNoMessages,
    isActiveSession,
    shouldLoadConversation,
    threadId: activeChat?.thread_id,
  });

  const { toolCallResponses } = useAppSelector((state) => state.responsePanel) as {
    toolCallResponses: ToolCallResponse[];
  };
  const visibleResponses = activeMessageId
    ? toolCallResponses.filter((response) => response.messageId === activeMessageId)
    : toolCallResponses;
  const isPanelVisible = visibleResponses.length > 0 && responsePanelWidth > 0;

  useEffect(() => {
    const defaultAssistant =
      availableAssistants.find((assist) => assist.name === 'report_agent') || availableAssistants[0];
    if (defaultAssistant && !activeChatId) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
  }, [dispatch, availableAssistants, activeChatId]);

  useEffect(() => {
    if (!selectedCompany?.name) {
      console.log('home company');
      router.push('/company-selection');
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

  // Add sidebar collapse handler
  const handleSidebarCollapse = () => {
    dispatch(toggleComponent({ id: 'sidebar-chat' }));
  };

  const ToolCallEventListener: FC = () => {
    useEffect(() => {
      const handleToolCallClick = (event: CustomEvent) => {
        if (event.detail && event.detail.messageId) {
          dispatch(setActiveMessageId(event.detail.messageId));
        }
      };
      window.addEventListener('toolCallSelected', handleToolCallClick as EventListener);
      return () => window.removeEventListener('toolCallSelected', handleToolCallClick as EventListener);
    }, []);
    return null;
  };

  const handleCompanyChange = () => {
    // window.location.reload();
    console.log('company changed');
  };

  // Show loading animation for company operations
  if (isCompanyLoading || isLoadingCompanies) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <LoadingAnimation message={'Loading company data... Please wait!'} />
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-white" style={{ minWidth: 0, minHeight: 0 }}>
      <ToolCallEventListener />
      {/* <ChatSidebar /> */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onClickSettings={() => {
          console.log('clicked settings');
          navigateToChatSettings('data-connections');
        }}
      />
      <div className="flex flex-1 w-full h-full flex-col" style={{ minWidth: 0 }}>
        <Navbar
          title="Chat"
          className="!h-[3.8rem]"
          isCollapsed={isSidebarCollapsed}
          collpaseSidebar={handleSidebarCollapse}
        >
          <div className="flex items-center gap-3">
            <ChatSearchDropdown />
            <NewChatButton />
          </div>
        </Navbar>
        <div className="flex flex-1 w-full flex-row overflow-hidden" style={{ minWidth: 0 }}>
          {' '}
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
                        overflowX: 'hidden',
                        minWidth: 0,
                        maxWidth: '60%',
                      }}
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
      </div>

      {/* Company Modal - rendered independently */}
      <CompanyModal onCompanyChange={handleCompanyChange} />
    </main>
  );
};

export default Home;
