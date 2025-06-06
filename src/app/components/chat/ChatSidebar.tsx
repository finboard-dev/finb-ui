"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon, ChevronLeftIcon, PanelLeft, User, MessageSquare, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { initializeComponent, selectIsComponentOpen, toggleComponent } from "@/lib/store/slices/uiSlice";
import { CollapsedOrganizationDropdown, OrganizationDropdown } from "../chat/ui/OrganisationDropdown";
import {
  initializeNewChat,
  loadChatMessages,
  setActiveChatId,
  setChatsFromAPI,
  setIsLoadingMessages,
  processToolResponses,
  setResponsePanelWidth,
} from "@/lib/store/slices/chatSlice";
import { selectCompanyChatConversations, selectAllCompanyAssistants } from "@/lib/store/slices/companySlice";
import { getChatConversation } from "@/lib/services/ChatServices/getChatConversations";
import type { MessageType, ContentPart, AllChats } from "@/types/chat";
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice";
import { setMainContent } from "@/lib/store/slices/uiSlice";
import LoadingAnimation from "@/app/components/common/ui/GlobalLoading";

const ChatSidebarClient = () => {
  const dispatch = useAppDispatch();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const componentId = "sidebar-chat";

  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    if (!searchParams) return;

    const isOpenFromUrl = searchParams.get(componentId) === "open";
    dispatch(
        initializeComponent({
          type: "sidebar",
          id: componentId,
          isOpenFromUrl,
        })
    );
  }, [dispatch, searchParams, componentId]);

  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, componentId));
  const firstName = useAppSelector((state) => state.user.user?.firstName);
  const lastName = useAppSelector((state) => state.user.user?.lastName);
  const selectedCompany = useAppSelector((state) => state.user.selectedCompany);
  const chatConversations = useAppSelector(selectCompanyChatConversations);
  const availableAssistants = useAppSelector(selectAllCompanyAssistants);
  const { chats, activeChatId, pendingChat } = useAppSelector((state) => state.chat);

  useEffect(() => {
    if (chatConversations.length > 0) {
      dispatch(setChatsFromAPI(chatConversations));
      setIsInitialLoading(false);
    }
  }, [dispatch, chatConversations]);


  useEffect(() => {
    if (isSidebarOpen && chatListRef.current && chats.length > 0) {
      chatListRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [chats.length, isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen || !activeChatId) return;

    const activeElement = document.getElementById(`chat-${activeChatId}`);
    if (activeElement && chatListRef.current) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChatId, isSidebarOpen]);

  const updateUrlParams = (isOpen: boolean) => {
    if (!searchParams) return;

    const params = new URLSearchParams(searchParams.toString());
    if (isOpen) {
      params.set(componentId, "open");
    } else {
      params.delete(componentId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleToggle = () => {
    const newState = !isSidebarOpen;
    dispatch(toggleComponent({ id: componentId, forceState: newState }));
    updateUrlParams(newState);
  };

  const handleSidebarClick = () => {
    if (!isSidebarOpen) {
      handleToggle();
    }
  };

  const handleNewChat = (e: React.MouseEvent, assistantId?: string) => {
    e.stopPropagation();
    const selectedAssistant = assistantId
        ? availableAssistants.find((assist) => assist.id === assistantId)
        : availableAssistants.find((assist) => assist.name === "report_agent") || availableAssistants[0];

    if (selectedAssistant) {
      dispatch(initializeNewChat({ assistantId: selectedAssistant.id }));
    }
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat")); // Ensure chat view is active
  };

  const handleAssistantChange = (assistantId: string) => {
    dispatch(initializeNewChat({ assistantId }));
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat")); // Ensure chat view is active
  };

  const handleCompanyChange = () => {
    const defaultAssistant =
        availableAssistants.find((assist) => assist.name === "report_agent") || availableAssistants[0];
    if (defaultAssistant) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat")); // Ensure chat view is active
  };

  const handleSelectChat = async (chatId: string) => {
    dispatch(setActiveChatId(chatId));
    dispatch(setMainContent("chat")); // Switch to chat view
    const chat = chats.find((c) => c.id === chatId) || pendingChat;
    if (chat && chat.thread_id) {
      try {
        dispatch(setIsLoadingMessages(true));
        const response = await getChatConversation(chat.thread_id);
        dispatch(loadChatMessages({ chatId, messages: response.messages }));
        processToolResponses(response.messages, dispatch);
        const toolMessages = response.messages.filter((msg: { type: string; }) => msg.type === "tool");
        if (toolMessages.length > 0) {
          const latestToolCallId = toolMessages[toolMessages.length - 1].tool_call_id;
          dispatch(setActiveToolCallId(latestToolCallId));
          dispatch(setResponsePanelWidth(30));
        }
      } catch (error) {
        console.error("Failed to load chat messages:", error);
        dispatch(setIsLoadingMessages(false));
      }
    }
  };

  const getChatName = (chatIndex: number, chat: AllChats) => {
    if (chat.name && chat.name !== "New Chat") {
      return chat.name;
    }

    const firstUserMessage: MessageType | undefined = chat.chats[0]?.messages.find(
        (msg: MessageType) => msg.role === "user"
    );

    if (firstUserMessage) {
      const textContent = firstUserMessage.content
          .filter((part: ContentPart) => part.type === "text")
          .map((part) => (part as { type: "text"; content: string }).content)
          .join("");
      const truncatedContent = textContent.substring(0, 20);
      return truncatedContent + (textContent.length > 20 ? "..." : "");
    }

    return `Untitled Chat ${chatIndex + 1}`;
  };

  const getTimeGroup = (lastMessageAt?: string) => {
    if (!lastMessageAt) return 'Recent';
    
    const now = new Date();
    const messageDate = new Date(lastMessageAt);
    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Today
    if (diffDays === 0 && 
        now.getDate() === messageDate.getDate() && 
        now.getMonth() === messageDate.getMonth() && 
        now.getFullYear() === messageDate.getFullYear()) {
      return 'Recent';
    }
    
    // Yesterday
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    // This week (within last 7 days)
    if (diffDays < 7) {
      return 'This Week';
    }
    
    // This month
    if (now.getMonth() === messageDate.getMonth() && now.getFullYear() === messageDate.getFullYear()) {
      return 'This Month';
    }
    
    // Last month
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    if (lastMonth.getMonth() === messageDate.getMonth() && lastMonth.getFullYear() === messageDate.getFullYear()) {
      return 'Last Month';
    }
    
    // Last year
    if (now.getFullYear() === messageDate.getFullYear()) {
      return 'This Year';
    }
    
    return 'Last Year';
  };
  
  // Group chats by time periods
  const groupChatsByTime = () => {
    const groups: Record<string, AllChats[]> = {
      'Recent': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Last Month': [],
      'This Year': [],
      'Last Year': []
    };
    
    // Sort chats by lastMessageAt in descending order
    const sortedChats = [...chats].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
    
    sortedChats.forEach(chat => {
      const group = getTimeGroup(chat.lastMessageAt);
      groups[group].push(chat);
    });
    
    return groups;
  };
  
  const chatGroups = groupChatsByTime();
  
  return (
      <div
          onClick={handleSidebarClick}
          className={`h-full flex bg-sidebar-primary flex-col border-r border-primary bg-gray-50 transition-all duration-75 ${
              isSidebarOpen ? "w-64" : "w-16 cursor-pointer hover:opacity-90"
          }`}
      >
        <div className="py-4 px-4 border-b border-primary flex items-center justify-between">
          {isSidebarOpen ? (
              <>
                <h2 className="font-medium text-heading text-lg">FinB</h2>
                <Button
                    onClick={handleToggle}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer hover:bg-gray-200"
                >
                  <ChevronLeftIcon className="h-4 w-4 logo-text" />
                </Button>
              </>
          ) : (
              <Button
                  onClick={handleToggle}
                  variant="ghost"
                  size="icon"
                  className="w-full cursor-pointer h-8 hover:bg-gray-200 flex items-center justify-center"
              >
                <PanelLeft className="h-4 w-4 logo-text" />
              </Button>
          )}
        </div>
  
        <div className="border-b border-gray-200">
          {isSidebarOpen ? (
              <div className="p-3">
                <OrganizationDropdown onCompanyChange={handleCompanyChange} />
              </div>
          ) : (
              <CollapsedOrganizationDropdown />
          )}
        </div>
  
        <div className="p-4 border-b border-gray-200">
          {isSidebarOpen ? (
              <Button
                  variant="default"
                  id="new-chat-button"
                  onClick={(e) => handleNewChat(e)}
                  className="w-full flex cursor-pointer justify-start text-white-text items-center gap-2 bg-background-button-dark hover:bg-background-button-dark/90"
              >
                <PlusIcon className="h-4 w-4 text-white-text" />
                New Chat
              </Button>
          ) : (
              <Button
                  id="new-chat-button"
                  onClick={(e) => handleNewChat(e)}
                  className="w-full rounded-full text-white-text cursor-pointer flex items-center justify-center h-fit bg-background-button-dark hover:bg-background-button-dark/90"
              >
                <PlusIcon className="h-5 w-5 text-white-text" />
              </Button>
          )}
        </div>
  
        <div
            ref={chatListRef}
            id="chat-history-container"
            className="flex-1 overflow-y-auto py-2 border-b border-gray-200 scroll-smooth"
        >
          {isInitialLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingAnimation message={"loading chats"}/>
              </div>
          ) : (
              <>
                {isSidebarOpen && !isSidebarOpen && chats.length > 0 && (
                    <div className="pl-5 mb-2">
                      <h3 className="text-xs font-medium text-[#949599] uppercase tracking-wider">Recent Conversations</h3>
                    </div>
                )}
  
                <div className={`${isSidebarOpen ? "px-3" : "hidden"} space-y-3`}>
                  {Object.entries(chatGroups).map(([group, groupChats]) => 
                    groupChats.length > 0 && (
                      <div key={group} className="space-y-1">
                        <div className="pl-2 mb-1">
                          <h3 className="text-xs font-medium text-[#949599] uppercase tracking-wider">{group}</h3>
                        </div>
                        {groupChats.map((chat, index) => (
                          <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            id={`chat-${chat.id}`}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                              chat.id === activeChatId ? "bg-[#EDEDED]" : "hover:bg-[#EDEDED]"
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate flex-1">
                              {!isSidebarOpen && <MessageSquare className="h-4 w-4 text-gray-500" />}
                              {isSidebarOpen && <span className="truncate font-serif font-normal text-primary text-sm">{getChatName(index, chat)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
  
                  {chats.length === 0 && isSidebarOpen && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">No conversations yet. Start a new chat!</div>
                  )}
                </div>
              </>
          )
          }
        </div>

        <div className="mt-auto">
          <div className={`p-3 ${isSidebarOpen ? "border-t border-gray-100" : ""}`}>
            <div className="flex items-center justify-between">
              {isSidebarOpen ? (
                  <>
                    <div className="flex items-center p-2 rounded-md hover:bg-gray-200 flex-1">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{`${firstName} ${lastName}`}</p>
                      </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        id="settings-button"
                        className="h-8 w-8 hover:bg-gray-200"
                        onClick={() => dispatch(setMainContent("settings"))}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </>
              ) : (
                  <Button variant="ghost" size="icon" id="user-profile-button" className="h-8 w-8 hover:bg-gray-200">
                    <User className="h-5 w-5" />
                  </Button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

const ChatSidebar = () => {
  return <ChatSidebarClient />;
};

export default ChatSidebar;