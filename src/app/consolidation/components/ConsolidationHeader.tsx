import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/common/navbar";

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
  <Navbar
    title={title}
    className="!h-[3.8rem]"
    collpaseSidebar={collpaseSidebar}
  />
);
