import React from "react";
import {
  ChevronLeft,
  FileText,
  LayoutGrid,
  Grid,
  ChevronLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store/store";
import { useUrlParams } from "@/lib/utils/urlParams";

export function Sidebar() {
  const { toggleComponentState } = useUrlParams();
  const companyModalId = "company-selection";
  const selectedCompany = store.getState().user.selectedCompany;
  return (
    <aside className="w-60 bg-white border-r flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center mb-10">
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mr-2">
            <span className="font-bold text-lg text-black">F</span>
          </div>
          <span className="font-semibold text-xl text-black">FinBoard</span>
        </div>
        <nav className="space-y-1 mt-8">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Accounts
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="w-5 h-5 mr-2" /> Reports
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <LayoutGrid className="w-5 h-5 mr-2" /> Template Hub
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Grid className="w-5 h-5 mr-2" /> Consolidation
          </Button>
          <Button
            variant="outline"
            id="company-select-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
            className="w-full flex cursor-pointer bg-[#F2FAF6] text-text-primary hover:bg-[#F2FAF7] justify-between items-center border-none"
          >
            <div className="flex items-center ">
              <span className="truncate">
                {selectedCompany?.name || "Select Company"}
              </span>
            </div>
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </Button>
        </nav>
      </div>
      <div className="space-y-2 pb-2">
        <Button variant="link" className="w-full justify-start">
          Request connector
        </Button>
        <Button variant="link" className="w-full justify-start">
          Request a demo
        </Button>
      </div>
    </aside>
  );
}
