"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setActiveChatId } from "@/lib/store/slices/chatSlice";
import { setMainContent } from "@/lib/store/slices/uiSlice";
import Home from "./components/chat/Home";
import { syncUrlParamsToRedux } from "@/lib/utils/urlParams";
import { useInactiveCompany } from "@/hooks/useInactiveCompany";

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id");
  const { chats, pendingChat } = useAppSelector((state) => state.chat);

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

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

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Fin Chat" />;
  }

  return <Home />;
};

export default ChatPage;
