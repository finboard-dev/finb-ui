import React from "react";
import { ChevronLeft } from "lucide-react";

interface ConsolidationHeaderProps {
  title?: string;
  onBack?: () => void;
}

export const ConsolidationHeader: React.FC<ConsolidationHeaderProps> = ({
  title = "Consolidation",
  onBack,
}) => (
  <header className="flex items-center justify-between px-10 py-3 border-b bg-white shrink-0">
    <div className="flex items-center gap-4">
      <button className="text-gray-500 hover:text-gray-700" onClick={onBack}>
        <span className="material-icons">
          <ChevronLeft />
        </span>
      </button>
      <h1 className="text-xl text-dark-pre font-semibold">{title}</h1>
    </div>
    <div className="w-10 h-10 rounded-full bg-[#E6F0FF] flex items-center justify-center text-[#2B7BFF] font-bold">
      A
    </div>
  </header>
);
