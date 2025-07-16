"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setActiveSettingsSection,
  setMainContent,
  toggleComponent,
  selectIsComponentOpen,
} from "@/lib/store/slices/uiSlice";
import Settings from "../../../components/pages/Settings";
import { syncUrlParamsToRedux, useUrlParams } from "@/lib/utils/urlParams";
import { Sidebar } from "@/components/ui/common/sidebar";
import Navbar from "@/components/ui/common/navbar";
import { CompanyModal } from "../../../components/ui/common/CompanyModal";

const ChatSettingsPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { navigateToContent } = useUrlParams();
  const section = searchParams.get("section");

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, "sidebar-chat")
  );
  const isSidebarCollapsed = !isSidebarOpen;

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: "sidebar",
        id: "sidebar-chat",
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

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

  const handleSidebarCollapse = () => {
    dispatch(toggleComponent({ id: "sidebar-chat" }));
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Navbar
          title="Settings"
          isCollapsed={isSidebarCollapsed}
          className="!h-[3.8rem]"
          collpaseSidebar={handleSidebarCollapse}
        />

        {/* Settings Content */}
        <div className="flex-1 overflow-hidden">
          <Settings onBackClick={handleBackClick} />
        </div>
      </div>
      <CompanyModal />
    </div>
  );
};

export default ChatSettingsPage;
