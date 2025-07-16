import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsolidationHeaderProps {
  title?: string;
  collpaseSidebar?: () => void;
  isCollapsed?: boolean;
}

export const ConsolidationHeader: React.FC<ConsolidationHeaderProps> = ({
  title = "Mapping",
  collpaseSidebar,
  isCollapsed = false,
}) => (
  <header className="flex items-center justify-between px-10 py-3 border-b bg-white shrink-0">
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="text-sec hover:text-gray-700"
        onClick={collpaseSidebar}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="w-5 h-5 text-sec" />
        ) : (
          <PanelLeftClose className="w-5 h-5 text-sec" />
        )}
      </Button>
      <h1 className="text-xl text-primary font-medium">{title}</h1>
    </div>
  </header>
);
