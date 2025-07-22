"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Share2Icon,
  PlusIcon,
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  SaveIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  toggleComponent,
  selectIsComponentOpen,
} from "@/lib/store/slices/uiSlice";
import Navbar from "@/components/ui/common/navbar";
import { toast } from "sonner";
import { format } from "date-fns";

interface DashboardSpecificHeaderProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onSaveDashboard: () => void;
  currentDashboardName?: string;
  isViewOnly: boolean;
  tabs: { id: string; label: string }[];
  activeTab: string | null;
  onTabChange: (id: string) => void;
  onTabReorder?: (newTabs: { id: string; label: string }[]) => void;
  loadedTabs?: Set<string>;
  currentTabLoading?: boolean;
  // New props for versioning
  currentVersion?: "draft" | "published";
  canEdit?: boolean;
  canPublish?: boolean;
  onSaveDraft?: () => void;
  onPublishDraft?: () => void;
  onSwitchToDraft?: () => void;
  onSwitchToPublished?: () => void;
  onAddNewTab?: (tabData: {
    title: string;
    startDate: string;
    endDate: string;
    position: number;
  }) => void;
  publishedVersion?: any;
  draftVersion?: any;
}

interface DateRange {
  start?: Date;
  end?: Date;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DashboardSpecificHeader({
  isEditing,
  setIsEditing,
  onSaveDashboard,
  currentDashboardName,
  isViewOnly,
  tabs,
  activeTab,
  onTabChange,
  onTabReorder,
  loadedTabs = new Set(),
  currentTabLoading = false,
  // New props for versioning
  currentVersion = "published",
  canEdit = false,
  canPublish = false,
  onSaveDraft,
  onPublishDraft,
  onSwitchToDraft,
  onSwitchToPublished,
  onAddNewTab,
  publishedVersion,
  draftVersion,
}: DashboardSpecificHeaderProps) {
  const dispatch = useAppDispatch();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, "sidebar-chat")
  );
  const isSidebarCollapsed = !isSidebarOpen;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const [localTabs, setLocalTabs] = useState(tabs);
  const [autoScrollInterval, setAutoScrollInterval] =
    useState<NodeJS.Timeout | null>(null);

  // New tab modal state
  const [isNewTabModalOpen, setIsNewTabModalOpen] = useState(false);
  const [newTabTitle, setNewTabTitle] = useState("");
  const [newTabDateRange, setNewTabDateRange] = useState<DateRange>({});
  const [newTabDatePickerOpen, setNewTabDatePickerOpen] = useState(false);
  const [newTabViewYear, setNewTabViewYear] = useState(
    new Date().getFullYear()
  );

  // Update local tabs when props change
  useEffect(() => {
    setLocalTabs(tabs);
  }, [tabs]);

  // Determine if we should show edit/view mode based on versioning logic
  const shouldShowEditMode = currentVersion === "draft";
  const shouldShowViewMode = currentVersion === "published";
  const canSwitchToDraft =
    canEdit && currentVersion === "published" && draftVersion;
  const canSwitchToPublished =
    canEdit && currentVersion === "draft" && publishedVersion;
  const isViewOnlyMode = shouldShowViewMode || !canEdit;

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [localTabs]);

  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", tabId);

    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTab(null);
    setDragOverTab(null);

    // Clear auto-scroll interval
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTab(tabId);

    // Auto-scroll logic
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    const scrollThreshold = 60; // pixels from edge to trigger scroll

    // Clear existing interval
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    // Only start scrolling if mouse is within the threshold and scrolling is possible
    if (mouseX < containerRect.left + scrollThreshold && canScrollLeft) {
      const interval = setInterval(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          // Check if we can still scroll left
          if (container.scrollLeft <= 0) {
            clearInterval(interval);
            setAutoScrollInterval(null);
            return;
          }

          scrollContainerRef.current.scrollBy({ left: -10, behavior: "auto" });
          // Update scroll buttons after scrolling
          updateScrollButtons();
        }
      }, 16); // ~60fps
      setAutoScrollInterval(interval);
    } else if (
      mouseX > containerRect.right - scrollThreshold &&
      canScrollRight
    ) {
      const interval = setInterval(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          // Check if we can still scroll right
          if (
            container.scrollLeft >=
            container.scrollWidth - container.clientWidth - 1
          ) {
            clearInterval(interval);
            setAutoScrollInterval(null);
            return;
          }

          scrollContainerRef.current.scrollBy({ left: 10, behavior: "auto" });
          // Update scroll buttons after scrolling
          updateScrollButtons();
        }
      }, 16); // ~60fps
      setAutoScrollInterval(interval);
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);

    // Clear auto-scroll interval when leaving drag area
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTabId: string) => {
    e.preventDefault();

    if (!draggedTab || draggedTab === dropTabId) {
      setDragOverTab(null);
      return;
    }

    const draggedIndex = localTabs.findIndex((tab) => tab.id === draggedTab);
    const dropIndex = localTabs.findIndex((tab) => tab.id === dropTabId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newTabs = [...localTabs];
    const [draggedTabData] = newTabs.splice(draggedIndex, 1);
    newTabs.splice(dropIndex, 0, draggedTabData);

    setLocalTabs(newTabs);
    onTabReorder?.(newTabs);
    setDragOverTab(null);
  };

  const needsScrolling = localTabs.length > 3;

  const handleSidebarToggle = () => {
    dispatch(toggleComponent({ id: "sidebar-chat" }));
  };

  // New tab modal functions
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatRange = () => {
    if (newTabDateRange.start && newTabDateRange.end) {
      return (
        <div className="flex items-center gap-2">
          <span>{formatMonthYear(newTabDateRange.start)}</span>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span>{formatMonthYear(newTabDateRange.end)}</span>
        </div>
      );
    } else if (newTabDateRange.start) {
      return `From ${formatMonthYear(newTabDateRange.start)}`;
    } else if (newTabDateRange.end) {
      return `Until ${formatMonthYear(newTabDateRange.end)}`;
    }
    return "Select date range";
  };

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatToYYYYMMDD = (date: Date, isEndDate: boolean = false) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    let day = "01";

    if (isEndDate) {
      const lastDay = getLastDayOfMonth(date.getFullYear(), date.getMonth());
      day = String(lastDay).padStart(2, "0");
    }

    return `${year}-${month}-${day}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = new Date(newTabViewYear, monthIndex);

    if (
      !newTabDateRange.start ||
      (newTabDateRange.start && newTabDateRange.end)
    ) {
      // Start new selection
      setNewTabDateRange({ start: selectedDate, end: undefined });
    } else if (newTabDateRange.start && !newTabDateRange.end) {
      // Complete the range
      if (selectedDate >= newTabDateRange.start) {
        setNewTabDateRange({ ...newTabDateRange, end: selectedDate });
        setNewTabDatePickerOpen(false);
      } else {
        // If selected date is before start, make it the new start
        setNewTabDateRange({ start: selectedDate, end: newTabDateRange.start });
        setNewTabDatePickerOpen(false);
      }
    }
  };

  const getMonthStatus = (monthIndex: number) => {
    const currentDate = new Date(newTabViewYear, monthIndex);

    if (!newTabDateRange.start) return "default";

    const startTime = newTabDateRange.start.getTime();
    const currentTime = currentDate.getTime();

    if (newTabDateRange.start && !newTabDateRange.end) {
      if (currentTime === startTime) return "start";
      return "default";
    }

    if (newTabDateRange.start && newTabDateRange.end) {
      const endTime = newTabDateRange.end.getTime();

      if (currentTime === startTime) return "start";
      if (currentTime === endTime) return "end";
      if (currentTime > startTime && currentTime < endTime) return "in-range";
    }

    return "default";
  };

  const getMonthButtonClass = (status: string) => {
    switch (status) {
      case "start":
        return "bg-primary text-white hover:bg-primary/90 hover:text-white shadow-md";
      case "end":
        return "bg-primary text-white hover:bg-primary/90 hover:text-white shadow-md";
      case "in-range":
        return "bg-white text-primary hover:bg-primary/20 hover:text-white border-primary/20";
      default:
        return "!bg-white text-gray-900 hover:bg-gray-100 border-gray-200";
    }
  };

  const clearNewTabDateRange = () => {
    setNewTabDateRange({});
  };

  const handleAddNewTab = () => {
    if (!newTabTitle.trim()) {
      toast.error("Please enter a tab title");
      return;
    }

    if (!newTabDateRange.start || !newTabDateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (newTabDateRange.end <= newTabDateRange.start) {
      toast.error("End date must be after start date");
      return;
    }

    const startDate = formatToYYYYMMDD(newTabDateRange.start, false);
    const endDate = formatToYYYYMMDD(newTabDateRange.end, true);
    const position = localTabs.length; // Add to end of tabs

    onAddNewTab?.({
      title: newTabTitle.trim(),
      startDate,
      endDate,
      position,
    });

    // Reset form and close modal
    setNewTabTitle("");
    setNewTabDateRange({});
    setIsNewTabModalOpen(false);
  };

  const handleCloseNewTabModal = () => {
    setNewTabTitle("");
    setNewTabDateRange({});
    setIsNewTabModalOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20 flex-shrink-0">
      <Navbar
        className="h-[3.8rem] !px-4 !shadow-none"
        title={currentDashboardName || "Dashboard"}
        isCollapsed={isSidebarCollapsed}
        collpaseSidebar={handleSidebarToggle}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {!isViewOnlyMode && (
            <>
              {/* Edit/View Mode Button - Only show in draft mode */}
              {shouldShowEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-slate-50 text-primary px-3 h-9 rounded-md border-slate-300 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium hover:shadow-md transition-all duration-200"
                  onClick={() => setIsEditing(!isEditing)}
                  title={
                    isEditing ? "Switch to View Mode" : "Switch to Edit Mode"
                  }
                >
                  {isEditing ? (
                    <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <EditIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isEditing ? "View Mode" : "Edit Mode"}
                  </span>
                </Button>
              )}

              {/* Save Draft Button - Only show in draft mode */}
              {shouldShowEditMode && onSaveDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveDraft}
                  className="h-8 px-3 text-xs border-gray-200 hover:bg-gray-50"
                >
                  <SaveIcon className="w-3 h-3 mr-1" />
                  Save
                </Button>
              )}

              {/* Publish Button - Only show in draft mode when can publish */}
              {shouldShowEditMode && canPublish && onPublishDraft && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onPublishDraft}
                  className="h-8 px-3 text-xs bg-primary text-white hover:bg-primary/90"
                >
                  Publish
                </Button>
              )}
            </>
          )}
        </div>
      </Navbar>

      {/* Bottom Row - Tabs Navigation */}
      <div className="px-4 md:px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {needsScrolling && (
              <Button
                variant="ghost"
                size="sm"
                className={`p-1 h-8 w-8 rounded-full hover:bg-gray-100 transition-all duration-200 ${
                  !canScrollLeft
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md"
                }`}
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
            )}

            <div className="flex-1 mx-1 rounded-lg max-w-[400px]">
              <div className="relative">
                <div
                  ref={scrollContainerRef}
                  className="overflow-x-auto scrollbar-hide"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <div className="inline-flex gap-1 p-0.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-inner min-w-full">
                    {localTabs.map((tab, index) => {
                      const isLoaded = loadedTabs.has(tab.id);
                      const isLoading =
                        activeTab === tab.id && currentTabLoading;
                      const isActive = activeTab === tab.id;
                      const isDragging = draggedTab === tab.id;
                      const isDragOver = dragOverTab === tab.id;

                      return (
                        <div
                          key={tab.id}
                          draggable={!isViewOnlyMode && shouldShowEditMode}
                          onDragStart={(e) => handleDragStart(e, tab.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, tab.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, tab.id)}
                          className={`
                          group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer
                          transition-all duration-200 ease-in-out whitespace-nowrap
                          ${
                            isActive
                              ? "bg-white shadow-md shadow-blue-100/30 text-blue-600 border border-blue-200/30"
                              : "bg-transparent hover:bg-white/60 text-gray-600 hover:text-gray-800"
                          }
                          ${isDragging ? "opacity-50 scale-95" : ""}
                          ${
                            isDragOver
                              ? "bg-blue-50 border-2 border-dashed border-blue-300"
                              : ""
                          }
                          ${
                            !isViewOnlyMode && shouldShowEditMode
                              ? "hover:shadow-sm"
                              : ""
                          }
                        `}
                          onClick={() => !isLoading && onTabChange(tab.id)}
                        >
                          {!isViewOnlyMode && shouldShowEditMode && (
                            <GripVerticalIcon className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing" />
                          )}

                          {isLoading && (
                            <Loader2Icon className="w-3 h-3 animate-spin text-blue-500" />
                          )}

                          <span className="text-xs font-medium truncate flex-1">
                            {tab.label}
                          </span>

                          {isActive && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                          )}

                          {/* Active tab indicator */}
                          {isActive && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                          )}
                        </div>
                      );
                    })}

                    {/* Add New Tab Button - Only show in draft mode */}
                    {!isViewOnlyMode && shouldShowEditMode && (
                      <button
                        className="flex items-center justify-center px-2 py-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-white/60 transition-all duration-200 min-w-[40px] group"
                        onClick={() => setIsNewTabModalOpen(true)}
                      >
                        <PlusIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {needsScrolling && (
              <Button
                variant="ghost"
                size="sm"
                className={`p-1 h-8 w-8 rounded-full hover:bg-gray-100 transition-all duration-200 ${
                  !canScrollRight
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md"
                }`}
                onClick={scrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Version indicator and switch buttons */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
              <span className="text-xs text-gray-600 font-medium">
                {currentVersion === "draft" ? "Draft" : "Published"}
              </span>
              {canSwitchToDraft && onSwitchToDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSwitchToDraft}
                  className="h-6 px-2 text-xs hover:bg-gray-100"
                >
                  Edit
                </Button>
              )}
              {canSwitchToPublished && onSwitchToPublished && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSwitchToPublished}
                  className="h-6 px-2 text-xs hover:bg-gray-100"
                >
                  View Published
                </Button>
              )}
            </div>

            {/* Share button */}
            {!isViewOnlyMode && (
              <Button
                variant="default"
                size="sm"
                className="bg-gray-800 text-white h-8 px-0 hover:bg-gray-700 transition-all duration-200 flex items-center"
              >
                <div className="flex items-center px-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5"
                  >
                    <mask
                      id="mask0_630_651"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="16"
                      height="16"
                    >
                      <rect width="16" height="16" fill="white" />
                    </mask>
                    <g mask="url(#mask0_630_651)">
                      <mask
                        id="mask1_630_651"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="16"
                        height="16"
                      >
                        <rect width="16" height="16" fill="white" />
                      </mask>
                      <g mask="url(#mask1_630_651)">
                        <path
                          d="M0.666504 11.4665C0.666504 11.0887 0.763726 10.7415 0.958171 10.4248C1.15262 10.1082 1.41095 9.8665 1.73317 9.69984C2.42206 9.35539 3.12206 9.09706 3.83317 8.92484C4.54428 8.75261 5.2665 8.6665 5.99984 8.6665C6.73317 8.6665 7.45539 8.75261 8.1665 8.92484C8.87761 9.09706 9.57762 9.35539 10.2665 9.69984C10.5887 9.8665 10.8471 10.1082 11.0415 10.4248C11.2359 10.7415 11.3332 11.0887 11.3332 11.4665V11.9998C11.3332 12.3665 11.2026 12.6804 10.9415 12.9415C10.6804 13.2026 10.3665 13.3332 9.99984 13.3332H1.99984C1.63317 13.3332 1.31928 13.2026 1.05817 12.9415C0.797059 12.6804 0.666504 12.3665 0.666504 11.9998V11.4665ZM12.2998 13.3332C12.4221 13.1332 12.5137 12.9193 12.5748 12.6915C12.6359 12.4637 12.6665 12.2332 12.6665 11.9998V11.3332C12.6665 10.8443 12.5304 10.3748 12.2582 9.92484C11.9859 9.47484 11.5998 9.08873 11.0998 8.7665C11.6665 8.83317 12.1998 8.94706 12.6998 9.10817C13.1998 9.26928 13.6665 9.4665 14.0998 9.69984C14.4998 9.92206 14.8054 10.1693 15.0165 10.4415C15.2276 10.7137 15.3332 11.0109 15.3332 11.3332V11.9998C15.3332 12.3665 15.2026 12.6804 14.9415 12.9415C14.6804 13.2026 14.3665 13.3332 13.9998 13.3332H12.2998ZM5.99984 7.99984C5.2665 7.99984 4.63873 7.73873 4.1165 7.2165C3.59428 6.69428 3.33317 6.0665 3.33317 5.33317C3.33317 4.59984 3.59428 3.97206 4.1165 3.44984C4.63873 2.92762 5.2665 2.6665 5.99984 2.6665C6.73317 2.6665 7.36095 2.92762 7.88317 3.44984C8.40539 3.97206 8.6665 4.59984 8.6665 5.33317C8.6665 6.0665 8.40539 6.69428 7.88317 7.2165C7.36095 7.73873 6.73317 7.99984 5.99984 7.99984ZM12.6665 5.33317C12.6665 6.0665 12.4054 6.69428 11.8832 7.2165C11.3609 7.73873 10.7332 7.99984 9.99984 7.99984C9.87761 7.99984 9.72206 7.98595 9.53317 7.95817C9.34428 7.93039 9.18873 7.89984 9.0665 7.8665C9.3665 7.51095 9.59706 7.1165 9.75817 6.68317C9.91928 6.24984 9.99984 5.79984 9.99984 5.33317C9.99984 4.8665 9.91928 4.4165 9.75817 3.98317C9.59706 3.54984 9.3665 3.15539 9.0665 2.79984C9.22206 2.74428 9.37761 2.70817 9.53317 2.6915C9.68873 2.67484 9.84428 2.6665 9.99984 2.6665C10.7332 2.6665 11.3609 2.92762 11.8832 3.44984C12.4054 3.97206 12.6665 4.59984 12.6665 5.33317Z"
                          fill="white"
                        />
                      </g>
                    </g>
                  </svg>
                  <span className="hidden sm:inline text-xs">Share</span>
                </div>
                <div className="border-l border-white h-full w-6 flex items-center justify-center">
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Button>
            )}

            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 border-gray-200 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <MoreHorizontalIcon className="w-4 h-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white shadow-xl border-slate-200 z-50"
              >
                <DropdownMenuItem className="text-sm cursor-pointer text-slate-700 hover:!bg-slate-100 focus:!bg-slate-100">
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm cursor-pointer text-slate-700 hover:!bg-slate-100 focus:!bg-slate-100">
                  Dashboard Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* New Tab Modal */}
      <Dialog open={isNewTabModalOpen} onOpenChange={handleCloseNewTabModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex text-2xl items-center gap-2">
              Add New Tab
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            {/* Tab Title */}
            <div className="space-y-2">
              <Label htmlFor="tabTitle">Tab Title</Label>
              <Input
                id="tabTitle"
                placeholder="Enter tab title..."
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Month-Year Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover
                open={newTabDatePickerOpen}
                onOpenChange={setNewTabDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 !bg-white transition-all duration-200",
                      !newTabDateRange.start &&
                        !newTabDateRange.end &&
                        "text-gray-500 border-input",
                      (newTabDateRange.start || newTabDateRange.end) &&
                        "border-primary/30 bg-primary/5"
                    )}
                  >
                    <Calendar className="mr-3 h-5 w-5 text-primary" />
                    <span className="text-base">{formatRange()}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 shadow-xl border-2 border-gray-200"
                  align="start"
                >
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTabViewYear(newTabViewYear - 1)}
                        className="hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-bold text-lg text-gray-900">
                        {newTabViewYear}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTabViewYear(newTabViewYear + 1)}
                        className="hover:bg-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {months.map((month, index) => {
                        const status = getMonthStatus(index);

                        return (
                          <Button
                            key={month}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMonthSelect(index)}
                            className={cn(
                              "h-12 text-sm font-medium border transition-all duration-200 hover:shadow-md",
                              getMonthButtonClass(status)
                            )}
                          >
                            {month.slice(0, 3)}
                          </Button>
                        );
                      })}
                    </div>

                    {(newTabDateRange.start || newTabDateRange.end) && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          {newTabDateRange.start && newTabDateRange.end
                            ? "Range selected"
                            : "Select end date"}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearNewTabDateRange}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Date range preview */}
              {newTabDateRange.start && newTabDateRange.end && (
                <div className="text-sm text-muted-foreground">
                  Duration:{" "}
                  {Math.ceil(
                    (newTabDateRange.end.getTime() -
                      newTabDateRange.start.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseNewTabModal}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddNewTab}
                className="flex-1 text-white"
              >
                Add Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
