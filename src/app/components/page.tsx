"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import { Sidebar } from "@/components/ui/common/sidebar";
import { CompanyModal } from "@/components/ui/common/CompanyModal";
import Navbar from "@/components/ui/common/navbar";
import { useInactiveCompany } from "@/hooks/useInactiveCompany";
import { useCompanyData } from "@/hooks/query-hooks/useCompany";
import { useSelector } from "react-redux";
import LoadingAnimation from "@/components/ui/common/GlobalLoading";

export default function ComponentsPage() {
  const dispatch = useAppDispatch();

  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );

  // Fetch company data
  const { isLoading: isCompanyDataLoading } = useCompanyData(selectedCompanyId);

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, "sidebar-chat")
  );
  const isSidebarCollapsed = !isSidebarOpen;

  useEffect(() => {
    dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: "sidebar",
        id: "sidebar-chat",
        isOpenFromUrl: true,
      },
    });
  }, [dispatch]);

  const handleSidebarCollapse = () => {
    dispatch(toggleComponent({ id: "sidebar-chat" }));
  };

  // Show loading while company data is being fetched
  if (isCompanyDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <LoadingAnimation message="Loading company data..." />
      </div>
    );
  }

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Components" />;
  }

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-x-hidden ml-0">
        {/* Header */}
        <Navbar
          title="Components"
          isCollapsed={isSidebarCollapsed}
          className="!h-[3.8rem]"
          collpaseSidebar={handleSidebarCollapse}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  Components Dashboard
                </h2>
                <p className="text-gray-600 mb-6">
                  Your reusable components and widgets will appear here.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <CompanyModal />
    </div>
  );
}
