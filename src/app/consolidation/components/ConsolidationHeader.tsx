import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:text-gray-700"
        onClick={onBack}
      >
        <span className="material-icons">
          <ChevronLeft />
        </span>
      </Button>
      <h1 className="text-xl text-dark-pre font-semibold">{title}</h1>
    </div>
  </header>
);
