"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2Icon,
  PlusIcon,
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  SaveIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DashboardSpecificHeaderProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onSaveDashboard: () => void;
  currentDashboardName?: string;
}

export default function DashboardSpecificHeader({
  isEditing,
  setIsEditing,
  onSaveDashboard,
  currentDashboardName,
}: DashboardSpecificHeaderProps) {
  const [activeTab, setActiveTab] = useState("profit-loss");

  const dashboardTabs = [
    { id: "profit-loss", label: "Profit & Loss" },
    { id: "cash-flow", label: "Cash Flow" },
    { id: "balance-sheet", label: "Balance Sheet" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20 h-[65px] flex-shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {currentDashboardName && !isEditing ? (
          <h1
            className="text-lg font-semibold text-slate-800 truncate"
            title={currentDashboardName}
          >
            {currentDashboardName}
          </h1>
        ) : (
          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="bg-gray-100 p-1 h-auto rounded-lg">
              {dashboardTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-gray-600 rounded-md"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="add-new-tab"
                className="px-2 sm:px-2.5 py-1.5 text-gray-500 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md"
              >
                <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isEditing && (
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 sm:px-4 text-xs sm:text-sm"
            onClick={onSaveDashboard}
          >
            <SaveIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Save
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-slate-50 text-slate-700 px-3 h-9 rounded-md border-slate-300 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium"
          onClick={() => setIsEditing(!isEditing)}
          title={isEditing ? "Switch to View Mode" : "Switch to Edit Mode"}
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

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 sm:px-4 text-xs sm:text-sm"
        >
          <Share2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 border-gray-300"
            >
              <MoreHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
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
  );
}
