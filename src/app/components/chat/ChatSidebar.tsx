"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, ChevronLeftIcon, PanelLeft, User } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddCompany from "../chat/ui/AddCompany";

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
  const userFirstName = useAppSelector((state) => state.user.user?.first_name);
  const userLastName = useAppSelector((state) => state.user.user?.last_name);
  const selectedCompany = useSelectedCompany();

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

  const handleNewCompanyClick = () => {
    return localStorage.removeItem("thread_id");
  };

  return (
    <div
      onClick={handleSidebarClick}
      className={`h-full flex bg-sidebar-primary flex-col border-r border-primary bg-gray-50 transition-all duration-300 ${
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

      {/* New Chat Button */}
      <div className="p-4">
        {isSidebarOpen ? (
          <Button
            variant={"ghost"}
            onClick={handleNewCompanyClick}
            className="w-full flex justify-start text-light cursor-pointer items-center gap-2 bg-background-button-dark"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </Button>
        ) : (
          <Button className="w-full rounded-full flex items-center justify-center h-fit bg-background-button-dark text-light">
            <PlusIcon className="h-5 w-5" />
          </Button>
        )}
        <AddCompany />
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2"></div>

      {/* Footer */}
      <div className="p-4 border-t border-primary">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {userFirstName} {userLastName}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper with Suspense boundary
const ChatSidebar = () => {
  return <ChatSidebarClient />;
};

export default ChatSidebar;
