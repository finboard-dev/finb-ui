"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ChevronLeftIcon,
  PanelLeft,
  User,
  UserRoundCheck,
  Settings,
  BarChart3,
  Check,
  Layers,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  initializeComponent,
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import {
  initializeNewChat,
  setActiveChatId,
  setChatsFromAPI,
} from "@/lib/store/slices/chatSlice";
import type { MessageType, ContentPart, AllChats } from "@/types/chat";
import { setMainContent } from "@/lib/store/slices/uiSlice";

import { Company } from "@/lib/store/slices/userSlice";
import { useUrlParams } from "@/lib/utils/urlParams";
import { Avatar } from "@radix-ui/react-avatar";
import {
  setSelectedCompany,
  setSelectedOrganization,
  selectUser,
} from "@/lib/store/slices/userSlice";
import { selectSelectedOrganization } from "@/lib/store/slices/userSlice";
import { setUserData } from "@/lib/store/slices/userSlice";

const ChatSidebarClient = () => {
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
  const componentId = "sidebar-chat";
  const orgDropdownId = "dropdown-organization";
  const companyModalId = "company-selection";

  const chatListRef = useRef<HTMLDivElement>(null);
  const userProfileRef = useRef<HTMLDivElement>(null);

  const companies = useAppSelector((state) => state.user.companies);
  const selectedCompany = useAppSelector(
    (state) => state.user.selectedCompany
  ) as Company & { assistants?: any[]; chatConversations?: any[] };
  const selectedOrganization = useAppSelector(selectSelectedOrganization);
  const user = useAppSelector(selectUser);
  const userOrganizations = useAppSelector(
    (state) => state.user.user?.organizations || []
  );

  // Get sidebar state from URL parameters (source of truth)
  const isSidebarOpen = isParamSet(componentId, "open");
  const isOrgDropdownOpen = isParamSet(orgDropdownId, "open");

  // Sync URL parameters to Redux state
  useEffect(() => {
    dispatch(
      initializeComponent({
        type: "sidebar",
        id: componentId,
        isOpenFromUrl: isSidebarOpen,
      })
    );
  }, [dispatch, componentId, isSidebarOpen]);

  const firstName = useAppSelector((state) => state.user.user?.firstName);
  const lastName = useAppSelector((state) => state.user.user?.lastName);
  const chatConversations = selectedCompany?.chatConversations || [];
  const availableAssistants: any[] = selectedCompany?.assistants || [];
  const { chats, activeChatId, pendingChat } = useAppSelector(
    (state) => state.chat
  );

  const lastChatsRef = useRef<any>(null);
  useEffect(() => {
    const chatsString = JSON.stringify(chatConversations);
    if (lastChatsRef.current !== chatsString) {
      dispatch(setChatsFromAPI(chatConversations));
      lastChatsRef.current = chatsString;
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

  // useEffect(() => {
  //   const activeCompanies = companies.filter((c) => c.status === "ACTIVE");
  //   const selectedCompanyStillExists = companies.some(
  //     (c) => c.id === selectedCompany?.id && c.status === "ACTIVE"
  //   );
  //   if (activeCompanies.length === 0 || !selectedCompanyStillExists) {
  //     dispatch(setSelectedCompany(null as any));
  //     // Optionally: clear chats, assistants, etc.
  //   }
  // }, [companies, selectedCompany, dispatch]);

  const handleToggle = () => {
    const newState = !isSidebarOpen;
    toggleComponentState(componentId, newState);
  };

  const handleSidebarClick = () => {
    if (!isSidebarOpen) {
      handleToggle();
    }
  };

  const handleNewChat = (e: React.MouseEvent, assistantId?: string) => {
    e.stopPropagation();
    const selectedAssistant = assistantId
      ? availableAssistants.find((assist: any) => assist.id === assistantId)
      : availableAssistants.find(
          (assist: any) => assist.name === "report_agent"
        ) || availableAssistants[0];

    if (selectedAssistant) {
      dispatch(initializeNewChat({ assistantId: selectedAssistant.id }));
    }
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat"));

    // Add a small delay to ensure Redux state is properly updated before URL change
    setTimeout(() => {
      startNewChat();
    }, 0);
  };

  const handleAssistantChange = (assistantId: string) => {
    dispatch(initializeNewChat({ assistantId }));
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat"));

    // Add a small delay to ensure Redux state is properly updated before URL change
    setTimeout(() => {
      startNewChat();
    }, 0);
  };

  const handleCompanyChange = () => {
    const defaultAssistant =
      availableAssistants.find(
        (assist: any) => assist.name === "report_agent"
      ) || availableAssistants[0];
    if (defaultAssistant) {
      dispatch(initializeNewChat({ assistantId: defaultAssistant.id }));
    }
    localStorage.removeItem("thread_id");
    dispatch(setMainContent("chat"));

    // Add a small delay to ensure Redux state is properly updated before URL change
    setTimeout(() => {
      startNewChat();
    }, 0);
  };

  const handleSelectChat = async (chatId: string) => {
    const chat = chats.find((c: any) => c.id === chatId) || pendingChat;

    if (chat && chat.thread_id) {
      // Use the new navigateToChat function to properly handle navigation
      navigateToChat(chat.thread_id);
    } else {
      // Fallback for chats without thread_id (shouldn't happen in normal flow)
      dispatch(setActiveChatId(chatId));
      dispatch(setMainContent("chat"));
    }
  };

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isOrgDropdownOpen;
    toggleComponentState(orgDropdownId, newState);
  };

  const getChatName = (chatIndex: number, chat: AllChats) => {
    if (chat.name && chat.name !== "New Chat") {
      return chat.name;
    }

    const firstUserMessage: MessageType | undefined =
      chat.chats[0]?.messages.find((msg: MessageType) => msg.role === "user");

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
    if (!lastMessageAt) return "Recent";

    const now = new Date();
    const messageDate = new Date(lastMessageAt);
    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Today
    if (
      diffDays === 0 &&
      now.getDate() === messageDate.getDate() &&
      now.getMonth() === messageDate.getMonth() &&
      now.getFullYear() === messageDate.getFullYear()
    ) {
      return "Recent";
    }

    // Yesterday
    if (diffDays === 1) {
      return "Yesterday";
    }

    // This week (within last 7 days)
    if (diffDays < 7) {
      return "This Week";
    }

    // This month
    if (
      now.getMonth() === messageDate.getMonth() &&
      now.getFullYear() === messageDate.getFullYear()
    ) {
      return "This Month";
    }

    // Last month
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    if (
      lastMonth.getMonth() === messageDate.getMonth() &&
      lastMonth.getFullYear() === messageDate.getFullYear()
    ) {
      return "Last Month";
    }

    // Last year
    if (now.getFullYear() === messageDate.getFullYear()) {
      return "This Year";
    }

    return "Last Year";
  };

  // Group chats by time periods
  const groupChatsByTime = () => {
    const groups: Record<string, AllChats[]> = {
      Recent: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      "Last Month": [],
      "This Year": [],
      "Last Year": [],
    };

    // Sort chats by lastMessageAt in descending order
    const sortedChats = [...chats].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    sortedChats.forEach((chat) => {
      const group = getTimeGroup(chat.lastMessageAt);
      groups[group].push(chat);
    });

    return groups;
  };

  const chatGroups = groupChatsByTime();

  const handleSettingsClick = () => {
    // Use the new navigateToChatSettings function to navigate to the chat settings page
    navigateToChatSettings("data-connections");
  };

  return (
    <div
      onClick={handleSidebarClick}
      className={`h-full flex bg-sidebar-primary flex-col border-r border-border-primary transition-all duration-75 relative ${
        isSidebarOpen ? "w-64" : "w-16 cursor-pointer hover:opacity-90"
      }`}
    >
      <div className="py-4 px-4 border-b border-border-primary flex items-center justify-between">
        {isSidebarOpen ? (
          <>
            <h2 className="font-medium text-heading text-lg">FinB</h2>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer hover:bg-gray-200"
            >
              <ChevronLeftIcon className="h-4 w-4 logo-text" />
            </Button>
          </>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            variant="ghost"
            size="icon"
            className="w-full cursor-pointer h-8 hover:bg-gray-200 flex items-center justify-center"
          >
            <PanelLeft className="h-4 w-4 logo-text" />
          </Button>
        )}
      </div>
      <div className="p-4 border-b border-gray-200 relative">
        {isSidebarOpen ? (
          <Button
            variant="outline"
            id="company-select-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
            className="w-full flex cursor-pointer border-gray-200 bg-white text-text-primary justify-between items-center"
          >
            <div className="flex items-center ">
              <span className="truncate">
                {selectedCompany?.name || "Select Company"}
              </span>
            </div>
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </Button>
        ) : (
          <Button
            id="company-select-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
            className="rounded-full border-gray-200 bg-white text-text-primary cursor-pointer flex items-center justify-center h-8 w-8"
            variant="outline"
            title={selectedCompany?.name || "Select Company"}
          >
            <UserRoundCheck className="h-4 w-4 text-text-primary" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-gray-200">
        {isSidebarOpen ? (
          <Button
            variant="outline"
            id="dashboard-button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/dashboard");
            }}
            className="w-full flex cursor-pointer border-gray-200 bg-white text-text-primary justify-start items-center gap-2 mb-4"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
        ) : (
          <Button
            id="dashboard-button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/dashboard");
            }}
            className="rounded-full border-gray-200 bg-white text-text-primary cursor-pointer flex items-center justify-center h-8 w-8 mb-4"
            variant="outline"
            title="Dashboard"
          >
            <BarChart3 className="h-4 w-4 text-text-primary" />
          </Button>
        )}

        {isSidebarOpen ? (
          <Button
            variant="outline"
            id="consolidation-button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/consolidation");
            }}
            className="w-full flex cursor-pointer border-gray-200 bg-white text-text-primary justify-start items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Consolidation
          </Button>
        ) : (
          <Button
            id="consolidation-button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/consolidation");
            }}
            className="rounded-full border-gray-200 bg-white text-text-primary cursor-pointer flex items-center justify-center h-8 w-8"
            variant="outline"
            title="Consolidation"
          >
            <Layers className="h-4 w-4 text-text-primary" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-gray-200">
        {isSidebarOpen ? (
          <Button
            variant="default"
            id="new-chat-button"
            onClick={(e) => handleNewChat(e)}
            className="w-full flex cursor-pointer justify-start text-white-text items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4 text-white-text" />
            New Chat
          </Button>
        ) : (
          <Button
            id="new-chat-button"
            onClick={(e) => handleNewChat(e)}
            className="w-full rounded-full cursor-pointer flex items-center justify-center h-fit bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </Button>
        )}
      </div>

      <div
        ref={chatListRef}
        id="chat-history-container"
        className="flex-1 overflow-y-auto py-2 border-b border-gray-200 scroll-smooth"
      >
        {isSidebarOpen && chats.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          <div className={`${isSidebarOpen ? "px-3" : "hidden"} space-y-3`}>
            {Object.entries(chatGroups).map(
              ([group, groupChats]) =>
                groupChats.length > 0 && (
                  <div key={group} className="space-y-1">
                    <div className="pl-2 mb-1">
                      <h3 className="text-xs font-medium text-[#949599] uppercase tracking-wider">
                        {group}
                      </h3>
                    </div>
                    {groupChats.map((chat, index) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        id={`chat-${chat.id}`}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          chat.id === activeChatId
                            ? "bg-[#EDEDED]"
                            : "hover:bg-[#EDEDED]"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate flex-1">
                          {!isSidebarOpen && (
                            <UserRoundCheck className="h-4 w-4 text-gray-500" />
                          )}
                          {isSidebarOpen && (
                            <span className="truncate font-serif font-normal text-text-primary text-sm">
                              {getChatName(index, chat)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div
          className={`p-3 ${isSidebarOpen ? "border-t border-gray-100" : ""}`}
        >
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <>
                <div
                  ref={userProfileRef}
                  onClick={handleUserProfileClick}
                  className="flex items-center p-2 rounded-md hover:bg-gray-200 flex-1 cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{`${firstName} ${lastName}`}</p>
                    {selectedOrganization && (
                      <p className="text-xs text-gray-500 truncate">
                        {selectedOrganization.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    id="settings-button"
                    className="h-8 w-8 hover:bg-gray-200"
                    onClick={handleSettingsClick}
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  id="user-profile-button"
                  className="h-8 w-8 hover:bg-gray-200"
                  title="User Profile"
                >
                  <Avatar className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organization Dropdown - positioned absolutely when open */}
      {isOrgDropdownOpen && isSidebarOpen && (
        <>
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => toggleComponentState(orgDropdownId, false)}
          />

          {/* Organization dropdown positioned at bottom */}
          <div className="fixed bottom-16 left-3 right-3 z-50 pointer-events-none">
            <div className="relative max-w-64 pointer-events-auto">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                {/* Organizations list */}
                <div className="max-h-64 overflow-y-auto py-1">
                  {userOrganizations.map((org: any) => {
                    const isSelected =
                      org.organization.id === selectedOrganization?.id;
                    return (
                      <div
                        key={org.organization.id}
                        className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-text-selected/10 text-text-selected"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          // Handle organization selection
                          const organizationToSelect = {
                            id: org.organization.id,
                            name: org.organization.name,
                            status: org.organization.status,
                            companies: [],
                            role: {
                              id: org.role.id,
                              name: org.role.name,
                              permissions: [],
                            },
                          };
                          dispatch(
                            setSelectedOrganization(organizationToSelect)
                          );

                          // Also update the user object to keep it in sync
                          if (user) {
                            const updatedUser = {
                              ...user,
                              role: {
                                id: org.role.id,
                                key: org.role.key,
                                name: org.role.name,
                                permissions: [],
                              },
                              selectedOrganization: organizationToSelect,
                            };

                            dispatch(
                              setUserData({
                                user: updatedUser,
                                selectedOrganization: organizationToSelect,
                              })
                            );
                          }

                          toggleComponentState(orgDropdownId, false);
                          handleCompanyChange();
                        }}
                      >
                        <div className="flex flex-grow flex-col">
                          <span className="text-sm font-medium">
                            {org.organization.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {org.role.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ChatSidebar = () => {
  return <ChatSidebarClient />;
};

export default ChatSidebar;
