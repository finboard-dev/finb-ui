"use client";

import { FC, useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setActiveChatId, setChatsFromAPI } from "@/lib/store/slices/chatSlice";
import { setMainContent } from "@/lib/store/slices/uiSlice";
import { useUrlParams } from "@/lib/utils/urlParams";
import type { AllChats, MessageType, ContentPart } from "@/types/chat";

const ChatSearchDropdown: FC = () => {
  const dispatch = useAppDispatch();
  const { navigateToChat } = useUrlParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { chats, activeChatId, pendingChat } = useAppSelector(
    (state) => state.chat
  );

  // Get selected company to access chat conversations
  const selectedCompany = useAppSelector(
    (state) => state.user.selectedCompany
  ) as any;
  const chatConversations = selectedCompany?.chatConversations || [];

  // Sync chats from API to Redux state
  const lastChatsRef = useRef<any>(null);
  useEffect(() => {
    const chatsString = JSON.stringify(chatConversations);
    if (lastChatsRef.current !== chatsString) {
      dispatch(setChatsFromAPI(chatConversations));
      lastChatsRef.current = chatsString;
    }
  }, [dispatch, chatConversations]);

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
    setIsOpen(false);
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
      const truncatedContent = textContent.substring(0, 30);
      return truncatedContent + (textContent.length > 30 ? "..." : "");
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

  // Filter chats based on search query
  const filteredChatGroups = useMemo(() => {
    if (!searchQuery.trim()) return chatGroups;

    const filtered: Record<string, AllChats[]> = {};

    Object.entries(chatGroups).forEach(([group, groupChats]) => {
      const filteredChats = groupChats.filter((chat) => {
        const chatName = getChatName(0, chat).toLowerCase();
        return chatName.includes(searchQuery.toLowerCase());
      });

      if (filteredChats.length > 0) {
        filtered[group] = filteredChats;
      }
    });

    return filtered;
  }, [chatGroups, searchQuery]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center w-56 text-sec justify-start gap-2 bg-white border-gray-200 hover:bg-gray-50"
        >
          <Search className="h-4 w-4" />
          Chats
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 bg-white shadow-lg border border-gray-200 max-h-96 overflow-hidden"
      >
        {/* Search Input */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-gray-300"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="max-h-64 overflow-y-auto">
          {Object.keys(filteredChatGroups).length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </div>
          ) : (
            Object.entries(filteredChatGroups).map(
              ([group, groupChats]) =>
                groupChats.length > 0 && (
                  <div key={group}>
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {/* {getTimeGroupIcon(group)} */}
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          {group}
                        </span>
                      </div>
                    </div>
                    {groupChats.map((chat, index) => (
                      <DropdownMenuItem
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 ${
                          chat.id === activeChatId ? "bg-gray-100" : ""
                        }`}
                      >
                        {/* <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" /> */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getChatName(index, chat)}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatSearchDropdown;
