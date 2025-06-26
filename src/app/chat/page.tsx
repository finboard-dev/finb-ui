"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setActiveChatId,
  setIsLoadingMessages,
  loadChatMessages,
} from "@/lib/store/slices/chatSlice";
import { setMainContent } from "@/lib/store/slices/uiSlice";
import { getChatConversation } from "@/lib/services/ChatServices/getChatConversations";
import {
  processToolResponses,
  setResponsePanelWidth,
} from "@/lib/store/slices/chatSlice";
import { setActiveToolCallId } from "@/lib/store/slices/responsePanelSlice";
import Home from "../components/chat/Home";
import { syncUrlParamsToRedux } from "@/lib/utils/urlParams";

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id");
  const { chats, pendingChat } = useAppSelector((state) => state.chat);

  // Sync URL parameters to Redux state (source of truth)
  useEffect(() => {
    syncUrlParamsToRedux(searchParams, dispatch);
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (threadId) {
      // Find the chat that matches this thread ID
      const chat =
        chats.find((c: any) => c.thread_id === threadId) || pendingChat;

      if (chat) {
        dispatch(setActiveChatId(chat.id));
        dispatch(setMainContent("chat"));

        // Load chat messages if not already loaded
        if (
          chat.thread_id &&
          (!chat.chats?.[0]?.messages || chat.chats[0].messages.length === 0)
        ) {
          const loadChatData = async () => {
            try {
              dispatch(setIsLoadingMessages(true));
              const response = await getChatConversation(chat.thread_id);
              dispatch(
                loadChatMessages({
                  chatId: chat.id,
                  messages: response.messages,
                })
              );
              processToolResponses(response.messages, dispatch);

              const toolMessages = response.messages.filter(
                (msg: { type: string }) => msg.type === "tool"
              );
              if (toolMessages.length > 0) {
                const latestToolCallId =
                  toolMessages[toolMessages.length - 1].tool_call_id;
                dispatch(setActiveToolCallId(latestToolCallId));
                dispatch(setResponsePanelWidth(30));
              }
            } catch (error) {
              console.error("Failed to load chat messages:", error);
            } finally {
              dispatch(setIsLoadingMessages(false));
            }
          };

          loadChatData();
        }
      }
    } else {
      // No threadId - check if we're navigating to settings
      const settingsSection = searchParams.get("settings-section");

      if (!settingsSection) {
        // No threadId and no settings section means we should show a new chat
        // Check if we have a pendingChat and set it as active
        if (pendingChat) {
          dispatch(setActiveChatId(pendingChat.id));
          dispatch(setMainContent("chat"));
        }
      }
      // If settingsSection exists, don't do anything - let the settings navigation handle it
    }
  }, [threadId, chats, pendingChat, dispatch, searchParams]);

  return <Home />;
};

export default ChatPage;
