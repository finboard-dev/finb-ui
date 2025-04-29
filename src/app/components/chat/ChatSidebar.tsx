"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ChevronLeftIcon,
  PanelLeft,
  User,
  Trash2,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  initializeComponent,
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import {
  CollapsedOrganizationDropdown,
  OrganizationDropdown,
} from "../chat/ui/OrganisationDropdown";
import { useSelectedCompany } from "@/hooks/useCustomConstants";
import {
  addChat,
  removeChat,
  setActiveChatId,
  clearMessages,
} from "@/lib/store/slices/chatSlice";
import AddCompany from "./ui/AddCompany";

// Client component - uses hooks
const ChatSidebarClient = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const componentId = "sidebar-chat";

  // Get search params safely on client side
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

  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, componentId)
  );
  const firstName = useAppSelector((state) => state.user.user?.firstName);
  const lastName = useAppSelector((state) => state.user.user?.lastName);
  const selectedCompany = useSelectedCompany();

  // Get chats and active chat ID
  const { chats, activeChatId } = useAppSelector((state) => state.chat);

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

  // Handle click on the sidebar when collapsed
  const handleSidebarClick = () => {
    if (!isSidebarOpen) {
      handleToggle();
    }
  };

  // Create a new chat
  const handleNewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addChat());
    localStorage.removeItem("thread_id");
  };

  // Set active chat
  const handleSelectChat = (chatId: string) => {
    dispatch(setActiveChatId(chatId));
  };

  // Delete a chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    dispatch(removeChat(chatId));
  };

  // Clear messages in a chat
  const handleClearChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    dispatch(clearMessages(chatId));
  };

  // Generate chat name based on first user message or default to "Untitled Chat"
  const getChatName = (chatIndex: number, chat: any) => {
    if (chat.name && chat.name !== "New Chat") {
      return chat.name;
    }

    const firstUserMessage = chat.chats[0]?.messages.find(
      (msg: any) => msg.role === "user"
    );

    if (firstUserMessage) {
      // Truncate message to first 20 chars
      const truncatedContent = firstUserMessage.content.substring(0, 20);
      return (
        truncatedContent + (firstUserMessage.content.length > 20 ? "..." : "")
      );
    }

    return `Untitled Chat ${chatIndex + 1}`;
  };

  return (
    <div
      onClick={handleSidebarClick}
      className={`h-full flex bg-sidebar-primary flex-col border-r border-primary bg-gray-50 transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-16 cursor-pointer hover:opacity-90"
      }`}
    >
      {/* Header Section */}
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

      {/* Organization Selection Section */}
      {selectedCompany && (
        <div className="border-b border-gray-200">
          {isSidebarOpen ? (
            <div className="p-3">
              <OrganizationDropdown />
            </div>
          ) : (
            <CollapsedOrganizationDropdown />
          )}
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="p-4 border-b border-gray-200">
        {isSidebarOpen ? (
          <Button
            variant="default"
            id="new-chat-button"
            onClick={handleNewChat}
            className="w-full flex cursor-pointer justify-start text-white items-center gap-2 bg-background-button-dark hover:bg-background-button-dark/90"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </Button>
        ) : (
          <Button
            id="new-chat-button"
            onClick={handleNewChat}
            className="w-full rounded-full text-white cursor-pointer flex items-center justify-center h-fit bg-background-button-dark hover:bg-background-button-dark/90"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto py-2 border-b border-gray-200">
        {isSidebarOpen && (
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent Conversations
            </h3>
          </div>
        )}

        <div className={`${isSidebarOpen ? "px-3" : "hidden"} space-y-1 pt-3`}>
          {chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              id={`chat-${chat.id}`}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                chat.id === activeChatId ? "bg-gray-200" : "hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate flex-1">
                {!isSidebarOpen && (
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                )}
                {isSidebarOpen && (
                  <>
                    <span className="truncate font-serif text-sm">
                      {getChatName(index, chat)}
                    </span>
                  </>
                )}
              </div>
              {/* {isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={(e) => handleClearChat(e, chat.id)}
                  title="Clear messages"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )} */}
            </div>
          ))}

          {chats.length === 0 && isSidebarOpen && (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              No conversations yet. Start a new chat!
            </div>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto">
        {/* {isSidebarOpen && (
          <div className="px-3 pt-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Profile
            </h3>
          </div>
        )} */}

        <div
          className={`p-3 ${isSidebarOpen ? "border-t border-gray-100" : ""}`}
        >
          {isSidebarOpen ? (
            <div className="flex items-center p-2 rounded-md hover:bg-gray-200">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{`${firstName} ${lastName}`}</p>
                <p className="text-xs text-gray-500">View profile</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                id="user-profile-button"
                className="h-8 w-8 hover:bg-gray-200"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper with Suspense boundary
const ChatSidebar = () => {
  return <ChatSidebarClient />;
};

export default ChatSidebar;
