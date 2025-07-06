"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  setActiveSettingsSection,
  setMainContent,
} from "@/lib/store/slices/uiSlice";
import Settings from "../../components/pages/Settings";
import ChatSidebar from "../../components/chat/layout/ChatSidebar";
import { syncUrlParamsToRedux, useUrlParams } from "@/lib/utils/urlParams";

const ChatSettingsPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { navigateToContent } = useUrlParams();
  const section = searchParams.get("section");

  // Sync URL parameters to Redux state
  useEffect(() => {
    syncUrlParamsToRedux(searchParams, dispatch);
  }, [searchParams, dispatch]);

  useEffect(() => {
    // Handle section parameter and set it as settings-section for compatibility
    if (
      section &&
      ["data-connections", "profile", "security", "users-roles"].includes(
        section
      )
    ) {
      dispatch(setActiveSettingsSection(section as any));
    } else {
      // Default to data-connections if no section specified
      dispatch(setActiveSettingsSection("data-connections"));
    }

    // Ensure we're in settings view
    dispatch(setMainContent("settings"));
  }, [section, dispatch]);

  const handleBackClick = () => {
    // Navigate back to chat using the proper navigation function
    navigateToContent("chat");
  };

  return (
    <div className="flex h-screen">
      {/* Chat Sidebar */}
      <ChatSidebar />

      {/* Settings Content */}
      <div className="flex-1 overflow-hidden">
        <Settings onBackClick={handleBackClick} />
      </div>
    </div>
  );
};

export default ChatSettingsPage;
