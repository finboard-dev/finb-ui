"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Building2,
  HelpCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedCompany } from "@/lib/store/slices/userSlice";
import { useRouter } from "next/navigation";
import { useUrlParams } from "@/lib/utils/urlParams";
import { logout } from "@/lib/api/logout";
import { clearBearerToken } from "@/lib/auth/tokenUtils";
import { toast } from "sonner";
import { useClearReduxState } from "@/hooks/useClearReduxState";

interface NavbarProps {
  className?: string;
  title: string;
  collpaseSidebar?: () => void;
  isCollapsed?: boolean;
  children?: React.ReactNode;
  hideSidebarToggle?: boolean;
}

const Navbar: FC<NavbarProps> = ({
  className = "",
  title,
  collpaseSidebar,
  isCollapsed,
  children,
  hideSidebarToggle = false,
}) => {
  const clearReduxState = useClearReduxState();
  const { navigateToChatSettings, toggleComponentState } = useUrlParams();
  const router = useRouter();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const user = useAppSelector((state) => state.user.user);
  const companyModalId = "company-selection";

  const handleLogout = async () => {
    try {
      await logout();
      clearBearerToken();
      await clearReduxState();
      router.push("/login");
      toast.success("Logged out successfully");
    } catch (e) {
      console.error("Error during logout:", e);
      alert("Error during logout. Please try again.");
    }
  };

  return (
    <nav
      className={`bg-white border-b border-gray-200 px-12 py-3 flex items-center justify-between sticky top-0 z-30 h-[4.06rem] flex-shrink-0 ${className}`}
    >
      {/* Left Section - Logo and Company */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* TODO: Add company selection */}
        <div className="flex items-center gap-4">
          {!hideSidebarToggle && collpaseSidebar && (
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
          )}
          <h1 className="text-xl text-primary font-medium">{title}</h1>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8"></div>

      {/* Right Section - Actions and User */}
      <div className="flex items-center gap-12">
        <div>{children}</div>
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full p-0 hover:bg-gray-100"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                  {user?.firstName?.[0] || user?.lastName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white shadow-lg border border-gray-200"
          >
            <DropdownMenuLabel className="font-medium text-gray-900">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigateToChatSettings("data-connections")}
              className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
