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

// Navigation items configuration
const navigationItems = [
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    href: "/reports",
  },
  {
    id: "template-hub",
    label: "Template Hub",
    icon: LayoutGrid,
    href: "/template-hub",
  },
  {
    id: "consolidation",
    label: "Consolidation",
    icon: Grid,
    href: "/consolidation",
  },
];

// Footer items configuration
const footerItems = [
  {
    id: "request-connector",
    label: "Request connector",
    href: "/request-connector",
  },
  {
    id: "request-demo",
    label: "Request a demo",
    href: "/request-demo",
  },
];

// Reusable Navigation Button Component
interface NavButtonProps {
  item: {
    id: string;
    label: string;
    icon?: React.ElementType;
    href?: string;
  };
  variant?: "ghost" | "outline" | "link";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = ({
  item,
  variant = "ghost",
  className = "w-full justify-start",
  onClick,
  children,
}) => {
  const Icon = item.icon;

  return (
    <Button variant={variant} className={className} onClick={onClick}>
      {Icon && <Icon className="mr-2 text-primary w-4 h-4" size={16} />}
      {children || item.label}
    </Button>
  );
};

export function Sidebar() {
  const { toggleComponentState } = useUrlParams();
  const companyModalId = "company-selection";
  const selectedCompany = store.getState().user.selectedCompany;

  return (
    <aside className="w-56 bg-white border-r flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center mb-10">
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mr-2">
            <span className="font-bold text-lg text-black">F</span>
          </div>
          <span className="font-semibold text-xl text-black">FinBoard</span>
        </div>
        <nav className="space-y-6 mt-8">
          {/* Mapped Navigation Items */}
          {navigationItems.map((item) => (
            <NavButton className="text-primary" key={item.id} item={item} />
          ))}

          {/* Company Selection Button */}
          <NavButton
            item={{
              id: "company-select",
              label: selectedCompany?.name || "Select Company",
            }}
            variant="outline"
            className="w-full flex cursor-pointer bg-[#F2FAF6] text-text-primary hover:bg-[#F2FAF7] justify-between items-center border-none"
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
          >
            <div className="flex items-center">
              <span className="truncate">
                {selectedCompany?.name || "Select Company"}
              </span>
            </div>
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </NavButton>
        </nav>
      </div>
      <div className="space-y-2 pb-2">
        {/* Mapped Footer Items */}
        {footerItems.map((item) => (
          <NavButton key={item.id} item={item} variant="link" />
        ))}
      </div>
    </aside>
  );
}
